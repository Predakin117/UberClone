// AI-assisted: see docs/AI_LOG.md #4
// Expo only exposes EXPO_PUBLIC_ variables to the client, and they must be read
// with static access (process.env.EXPO_PUBLIC_X), not with process.env[key].
// None of these are secret: the Firebase web config is public and protected by
// the Firestore rules; Cloudinary uses an unsigned upload preset.
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
