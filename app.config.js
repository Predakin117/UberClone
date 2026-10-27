// AI-assisted: see docs/AI_LOG.md #4
// Extiende app.json con valores que vienen del .env (Expo CLI lo carga automáticamente).
// GOOGLE_MAPS_API_KEY no lleva prefijo EXPO_PUBLIC_ para que no se incluya en el bundle JS.
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
