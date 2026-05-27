const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAndroidSound = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const resPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'raw');
      const soundFile = 'bird.wav';
      const source = path.join(projectRoot, 'assets', 'sounds', soundFile);
      const dest = path.join(resPath, soundFile);

      if (!fs.existsSync(resPath)) {
        fs.mkdirSync(resPath, { recursive: true });
      }

      if (fs.existsSync(source)) {
        fs.copyFileSync(source, dest);
      }
      return config;
    },
  ]);
};

module.exports = withAndroidSound;
