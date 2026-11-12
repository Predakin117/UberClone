// AI-assisted: see docs/AI_LOG.md #4
// Extends app.json with values from .env (Expo CLI loads it automatically).
// GOOGLE_MAPS_API_KEY has no EXPO_PUBLIC_ prefix so it is not included in the JS bundle.
export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY },
    },
  },
});
