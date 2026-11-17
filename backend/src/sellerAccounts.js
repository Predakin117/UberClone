// AI-assisted: see docs/AI_LOG.md #63
// The Mercado Pago accounts the drivers linked, for split payments. The
// tokens are saved with firebase-admin in mercadoPagoAccounts/{uid}: the
// Firestore rules have no match for that collection, so the app can't read
// or write it (only the backend, which skips the rules).
//
// A link is started with startLink(uid) and finished when Mercado Pago comes
// back with the code and the state. The states live in memory for 10
// minutes, like the email codes: if the server restarts, the driver taps
// "Link" again.
const crypto = require("node:crypto");

const COLLECTION = "mercadoPagoAccounts";
const STATE_TTL_MS = 10 * 60 * 1000;
// The access token is renewed when less than a day is left
const REFRESH_MARGIN_MS = 24 * 60 * 60 * 1000;

function createSellerAccounts({
  db,
  oauth,
  now = Date.now,
  newState = () => crypto.randomBytes(24).toString("hex"),
  logger = console,
}) {
  const pending = new Map();
  const accountRef = (uid) => db.collection(COLLECTION).doc(uid);

  // Expired states are removed so the map doesn't grow
  const dropExpired = () => {
    for (const [state, link] of pending) {
      if (link.expiresAt <= now()) pending.delete(state);
    }
  };

  /** Authorization page for the driver uid; the state lasts 10 minutes. */
  function startLink(uid) {
    dropExpired();
    const state = newState();
    pending.set(state, { uid, expiresAt: now() + STATE_TTL_MS });
    return oauth.authorizationUrl(state);
  }

  /**
   * Mercado Pago came back with code and state: the code is changed for the
   * driver's tokens and they are saved. Returns the driver's uid, or null if
   * the state is unknown or expired (the code is not used then).
   */
  async function finishLink(state, code) {
    dropExpired();
    const link = pending.get(state);
    if (!link || typeof code !== "string" || code === "") return null;
    pending.delete(state);
    const account = await oauth.exchangeCode(code);
    await accountRef(link.uid).set({ ...account, linkedAt: now() });
    return link.uid;
  }

  /** { linked, userId } of the driver; never returns the tokens. */
  async function status(uid) {
    const snapshot = await accountRef(uid).get();
    if (!snapshot.exists) return { linked: false, userId: null };
    return { linked: true, userId: snapshot.data().userId ?? null };
  }

  const unlink = (uid) => accountRef(uid).delete();

  /**
   * Access token of the driver's account, renewed first if it is about to
   * expire, or null if the driver didn't link one. If the renewal fails, the
   * old token is used while it still works. If Mercado Pago rejects the
   * refresh token (400 or 401, for example the driver removed the
   * permission), the link is removed: the trip is charged without split and
   * the driver can link the account again.
   */
  async function accessTokenFor(uid) {
    const snapshot = await accountRef(uid).get();
    if (!snapshot.exists) return null;
    const account = snapshot.data();
    if (account.expiresAt - now() > REFRESH_MARGIN_MS) {
      return account.accessToken;
    }
    try {
      const renewed = await oauth.refresh(account.refreshToken);
      await accountRef(uid).set({ ...account, ...renewed });
      return renewed.accessToken;
    } catch (refreshError) {
      logger.error("The Mercado Pago link could not be renewed:", refreshError.message);
      if (refreshError.status === 400 || refreshError.status === 401) {
        await unlink(uid);
        return null;
      }
      return account.expiresAt > now() ? account.accessToken : null;
    }
  }

  return { startLink, finishLink, status, unlink, accessTokenFor };
}

module.exports = { createSellerAccounts, COLLECTION };
