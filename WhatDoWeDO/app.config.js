// app.config.js – committed to git (no secrets)
// The Google Maps API key is read from the EAS secret GOOGLE_MAPS_API_KEY
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleMapsApiKey:
      process.env.GOOGLE_MAPS_API_KEY || config.android?.googleMapsApiKey,
  },
});
