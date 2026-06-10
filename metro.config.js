const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add wasm to asset extensions to fix expo-sqlite web/wasm module error
config.resolver.assetExts.push('wasm');

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

  // Handle lucide internal .mjs imports without adding .mjs globally to sourceExts
  // This prevents breaking other libraries (like zustand) that use import.meta in their .mjs files
  if (moduleName.startsWith('.') && moduleName.endsWith('.mjs') && context.originModulePath.includes('lucide-react-native')) {
    return {
      type: 'sourceFile',
      filePath: path.join(path.dirname(context.originModulePath), moduleName),
    };
  }

  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
