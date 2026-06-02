const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withFixAndroidManifestWarnings(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    if (!androidManifest.application || !androidManifest.application[0]) {
      return config;
    }

    const application = androidManifest.application[0];
    
    // Fix expo.modules.filesystem.FileSystemFileProvider
    if (application.provider) {
      application.provider.forEach(provider => {
        if (provider.$['android:name'] === 'expo.modules.filesystem.FileSystemFileProvider') {
          if (provider.$['tools:replace']) {
            provider.$['tools:replace'] = provider.$['tools:replace']
              .split(',')
              .filter(attr => attr !== 'android:authorities')
              .join(',');
            
            if (!provider.$['tools:replace']) {
              delete provider.$['tools:replace'];
            }
          }
        }
      });
    }

    // Fix expo.modules.imagepicker.ExpoCropImageActivity
    if (application.activity) {
      application.activity.forEach(activity => {
        if (activity.$['android:name'] === 'expo.modules.imagepicker.ExpoCropImageActivity') {
          if (activity.$['tools:replace']) {
            activity.$['tools:replace'] = activity.$['tools:replace']
              .split(',')
              .filter(attr => attr !== 'android:exported')
              .join(',');
            
            if (!activity.$['tools:replace']) {
              delete activity.$['tools:replace'];
            }
          }
        }
      });
    }

    return config;
  });
};
