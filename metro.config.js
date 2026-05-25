const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add wasm to asset extensions to fix expo-sqlite web/wasm module error
config.resolver.assetExts.push('wasm');

// Ensure Metro can resolve .mjs ESM files (needed for lucide-react-native tree-shaking)
if (!config.resolver.sourceExts.includes('mjs')) {
  config.resolver.sourceExts.push('mjs');
}

// Enable tree-shaking for lucide-react-native
// Instead of bundling all 1500+ icons, Metro will only include the ones imported
const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Match: import { ChevronLeft } from 'lucide-react-native'
  // Redirect to the individual ESM icon files for tree-shaking
  if (moduleName === 'lucide-react-native') {
    return {
      type: 'sourceFile',
      filePath: path.join(__dirname, 'node_modules/lucide-react-native/dist/esm/lucide-react-native.mjs'),
    };
  }
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
