// AI-assisted: see docs/AI_LOG.md #4
// Expo solo expone al cliente las variables con prefijo EXPO_PUBLIC_ y deben leerse
// con acceso estático (process.env.EXPO_PUBLIC_X), no con process.env[clave].
export const env = {
  firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  backendApiUrl: process.env.EXPO_PUBLIC_BACKEND_API_URL,
};
