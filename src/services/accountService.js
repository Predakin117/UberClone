// AI-assisted: see docs/AI_LOG.md #53
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
import { buildLoginKey, normalizeEmail } from "../validation/account";
import { toInternationalPhone } from "../validation/phone";

// Without a connection Firestore can wait forever for the server
const TIMEOUT_MS = 15000;

// code is a Firebase error code; authErrorKey() turns it into a translation key
export class AuthError extends Error {
  constructor(code, cause) {
    super(code);
    this.code = code;
    this.cause = cause;
  }
}

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new AuthError("auth/network-request-failed")),
        TIMEOUT_MS,
      ),
    ),
  ]);

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

/**
 * Looks up the account of an email or an international phone number.
 * Returns { email } when it exists, or null when there's no account.
 */
export const findAccount = (method, value) =>
  run(async () => {
    const snapshot = await withTimeout(
      getDoc(loginIndexDoc(buildLoginKey(method, value))),
    );
    return snapshot.exists() ? { email: snapshot.data().email } : null;
  });

/**
 * Logs in and returns { uid, name, status }. name and status come from the
 * driver's registration (drivers/{uid}) when it exists.
 */
export const signIn = (email, password) =>
  run(async () => {
    const { user } = await signInWithEmailAndPassword(
      auth,
      normalizeEmail(email),
      password,
    );

    // The registration may not exist yet or may not be readable: login still works
    let driver = null;
    try {
      const snapshot = await withTimeout(getDoc(doc(db, "drivers", user.uid)));
      driver = snapshot.exists() ? snapshot.data() : null;
    } catch (error) {
      console.warn("Could not read the driver registration:", error);
    }

    return {
      uid: user.uid,
      name: driver?.personal?.name ?? null,
      status: driver?.status ?? null,
    };
  });

/**
 * Creates the account and its lookup documents. Returns the uid.
 */
export const createAccount = ({ email, countryCode, phone, password }) =>
  run(async () => {
    const cleanEmail = normalizeEmail(email);
    const fullPhone = toInternationalPhone(countryCode, phone);
    const phoneKey = buildLoginKey("phone", fullPhone);

    // Checked first so no account is created for a phone that's already taken.
    // Firebase Auth already rejects a repeated email.
    const phoneSnapshot = await withTimeout(getDoc(loginIndexDoc(phoneKey)));
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
      await withTimeout(batch.commit());
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

    return user.uid;
  });

export const resetPassword = (email) =>
  run(() => sendPasswordResetEmail(auth, normalizeEmail(email)));

// Without Firebase there's no session to close, so this never fails
export const signOutAccount = async () => {
  if (isFirebaseConfigured && auth.currentUser) await signOut(auth);
};
