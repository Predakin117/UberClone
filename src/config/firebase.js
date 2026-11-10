// AI-assisted: see docs/AI_LOG.md #10
// Firebase con el SDK web (funciona en Expo Go). La sesión de Auth se guarda en
// AsyncStorage para que el conductor siga siendo el mismo al reabrir la app.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  signInAnonymously,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { env } from "./env";

const firebaseConfig = {
  apiKey: env.firebaseApiKey,
  authDomain: env.firebaseAuthDomain,
  projectId: env.firebaseProjectId,
  storageBucket: env.firebaseStorageBucket,
  messagingSenderId: env.firebaseMessagingSenderId,
  appId: env.firebaseAppId,
};

// Sin estos valores Firebase falla al iniciar; así la app abre igual y avisa al guardar
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

const createFirebase = () => {
  if (!isFirebaseConfigured) return { auth: null, db: null };

  // Con Fast Refresh este archivo se vuelve a ejecutar: no se inicializa dos veces
  if (getApps().length > 0) {
    const app = getApp();
    return { auth: getAuth(app), db: getFirestore(app) };
  }

  const app = initializeApp(firebaseConfig);
  const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  return { auth, db: getFirestore(app) };
};

export const { auth, db } = createFirebase();

// Devuelve el usuario actual o crea una sesión anónima (cada celular = un conductor)
export const ensureSignedIn = async () => {
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  const { user } = await signInAnonymously(auth);
  return user;
};
