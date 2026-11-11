// AI-assisted: see docs/AI_LOG.md #53, #54
// Accounts with Firebase Auth (email and password) plus Firestore lookup documents,
// so a driver can log in with either the email or the phone number.
//   loginIndex/{email_... | phone_...} → { uid, email }
//   accounts/{uid}                    → { email, phone, createdAt }
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  unlink,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../config/firebase";
import {
  buildLoginKey,
  normalizeEmail,
  validateLoginEmail,
  validateNewPassword,
} from "../validation/account";
import { toInternationalPhone, validateLoginPhone } from "../validation/phone";
import { withTimeout } from "./withTimeout";

const TIMEOUT_MS = 15000;

// code is a Firebase error code; authErrorKey() turns it into a translation key
export class AuthError extends Error {
  constructor(code, cause) {
    super(code);
    this.code = code;
    this.cause = cause;
  }
}

const withAuthTimeout = (promise) =>
  withTimeout(
    promise,
    TIMEOUT_MS,
    () => new AuthError("auth/network-request-failed"),
  );

// Runs fn and turns any Firebase error into an AuthError
const run = async (fn) => {
  if (!isFirebaseConfigured) throw new AuthError("auth/not-configured");
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError(error.code ?? "unknown", error);
  }
};

const loginIndexDoc = (key) => doc(db, "loginIndex", key);

// Reads a document that may not exist or may not be readable yet: null then
const readOptional = async (path) => {
  try {
    const snapshot = await withAuthTimeout(getDoc(doc(db, ...path)));
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    console.warn(`Could not read ${path.join("/")}:`, error);
    return null;
  }
};

/**
 * Looks up the account of an email or an international phone number.
 * Returns { email } when it exists, or null when there's no account.
 */
export const findAccount = (method, value) =>
  run(async () => {
    const snapshot = await withAuthTimeout(
      getDoc(loginIndexDoc(buildLoginKey(method, value))),
    );
    return snapshot.exists() ? { email: snapshot.data().email } : null;
  });

/**
 * Logs in and returns { uid, email, phone, name, status }. email and phone come
 * from the account (they fill in tab 1); name and status from the driver's
 * registration (drivers/{uid}). status is null while the registration hasn't
 * been submitted.
 */
export const signIn = (email, password) =>
  run(async () => {
    const { user } = await signInWithEmailAndPassword(
      auth,
      normalizeEmail(email),
      password,
    );

    // Login still works if they can't be read: the screen decides what's next
    const [account, driver] = await Promise.all([
      readOptional(["accounts", user.uid]),
      readOptional(["drivers", user.uid]),
    ]);

    return {
      uid: user.uid,
      email: account?.email ?? user.email,
      phone: account?.phone ?? null,
      name: driver?.personal?.name ?? null,
      status: driver?.status ?? null,
    };
  });

/**
 * Creates the account and its lookup documents. Returns { uid, email, phone }
 * only after Firestore confirmed the three documents, so the account can
 * always be found by email and by phone.
 */
export const createAccount = ({ email, countryCode, phone, password }) =>
  run(async () => {
    // The screen already validates; checked again so wrong data never gets saved
    const invalid = {
      ...validateLoginEmail(email),
      ...validateLoginPhone({ countryCode, phone }),
      ...validateNewPassword(password, email),
    };
    if (Object.keys(invalid).length > 0) {
      throw new AuthError("auth/invalid-data");
    }

    const cleanEmail = normalizeEmail(email);
    const fullPhone = toInternationalPhone(countryCode, phone);
    const phoneKey = buildLoginKey("phone", fullPhone);

    // Checked first so no account is created for a phone that's already taken.
    // Firebase Auth already rejects a repeated email.
    const phoneSnapshot = await withAuthTimeout(getDoc(loginIndexDoc(phoneKey)));
    if (phoneSnapshot.exists()) throw new AuthError("auth/phone-in-use");

    // A device that already started the registration has an anonymous session
    // (ensureSignedIn in firebase.js): linking keeps its uid and its saved tabs
    const anonymousUser = auth.currentUser?.isAnonymous ? auth.currentUser : null;
    const { user } = anonymousUser
      ? await linkWithCredential(
          anonymousUser,
          EmailAuthProvider.credential(cleanEmail, password),
        )
      : await createUserWithEmailAndPassword(auth, cleanEmail, password);

    try {
      const lookup = { uid: user.uid, email: cleanEmail };
      const batch = writeBatch(db);
      batch.set(doc(db, "accounts", user.uid), {
        email: cleanEmail,
        phone: fullPhone,
        createdAt: serverTimestamp(),
      });
      batch.set(loginIndexDoc(buildLoginKey("email", cleanEmail)), lookup);
      batch.set(loginIndexDoc(phoneKey), lookup);
      // commit() resolves when the server saved all three, or none of them
      await withAuthTimeout(batch.commit());
    } catch (error) {
      // Without its lookup documents nobody could log in to this account: undo it
      const undo = anonymousUser
        ? unlink(user, EmailAuthProvider.PROVIDER_ID)
        : user.delete();
      await undo.catch((undoError) =>
        console.warn("Could not undo the new account:", undoError),
      );
      throw error;
    }

    return { uid: user.uid, email: cleanEmail, phone: fullPhone };
  });

export const resetPassword = (email) =>
  run(() => sendPasswordResetEmail(auth, normalizeEmail(email)));

// Without Firebase there's no session to close, so this never fails
export const signOutAccount = async () => {
  if (isFirebaseConfigured && auth.currentUser) await signOut(auth);
};
