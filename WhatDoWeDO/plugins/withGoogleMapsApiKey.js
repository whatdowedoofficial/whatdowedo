const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withGoogleMapsApiKey(config) {
  return withAndroidManifest(config, async (config) => {
    const apiKey = config.android?.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('No googleMapsApiKey found in app.json');
      return config;
    }

    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Remove any existing Google Maps API key meta-data
    if (mainApplication['meta-data']) {
      mainApplication['meta-data'] = mainApplication['meta-data'].filter(
        (item) => item.$['android:name'] !== 'com.google.android.geo.API_KEY'
      );
    } else {
      mainApplication['meta-data'] = [];
    }

    // Add the new Google Maps API key meta-data
    mainApplication['meta-data'].push({
      $: {
        'android:name': 'com.google.android.geo.API_KEY',
        'android:value': apiKey,
      },
    });

    return config;
  });
};
