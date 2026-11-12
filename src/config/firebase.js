// AI-assisted: see docs/AI_LOG.md #10, #22
// Firebase with the web SDK (works in Expo Go). The Auth session is stored in
// AsyncStorage so the driver stays the same when the app is reopened.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  signInAnonymously,
} from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { env } from "./env";

const firebaseConfig = {
  apiKey: env.firebaseApiKey,
  authDomain: env.firebaseAuthDomain,
  projectId: env.firebaseProjectId,
  storageBucket: env.firebaseStorageBucket,
  messagingSenderId: env.firebaseMessagingSenderId,
  appId: env.firebaseAppId,
};

// Without these values Firebase fails on startup; this way the app still opens and warns on save
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

const createFirebase = () => {
  if (!isFirebaseConfigured) return { auth: null, db: null };

  // Fast Refresh re-runs this file: don't initialize twice
  if (getApps().length > 0) {
    const app = getApp();
    return { auth: getAuth(app), db: getFirestore(app) };
  }

  const app = initializeApp(firebaseConfig);
  const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  // Long polling en vez del streaming por defecto: en React Native algunas redes
  // cortan esa conexión y Firestore queda "sin conexión" ("Could not reach Cloud
  // Firestore backend"). Solo se configura aquí, al crear la app: con Fast Refresh
  // se reutiliza la instancia de arriba con getFirestore.
  const db = initializeFirestore(app, { experimentalForceLongPolling: true });
  return { auth, db };
};

export const { auth, db } = createFirebase();

// Returns the current user or creates an anonymous session (one phone = one driver)
export const ensureSignedIn = async () => {
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  const { user } = await signInAnonymously(auth);
  return user;
};
