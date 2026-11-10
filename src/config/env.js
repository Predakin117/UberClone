// AI-assisted: see docs/AI_LOG.md #4
// Expo solo expone al cliente las variables con prefijo EXPO_PUBLIC_ y deben leerse
// con acceso estático (process.env.EXPO_PUBLIC_X), no con process.env[clave].
// Ninguna de estas es secreta: la configuración web de Firebase es pública y la
// protegen las reglas de Firestore; Cloudinary usa un upload preset sin firma.
export const env = {
  firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  firebaseMessagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  cloudinaryCloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
  cloudinaryUploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  backendApiUrl: process.env.EXPO_PUBLIC_BACKEND_API_URL,
};
