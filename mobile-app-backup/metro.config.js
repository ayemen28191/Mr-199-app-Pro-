const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add any custom Metro configuration here
config.resolver.alias = {
  '@': './src',
};

// Fix for Metro bundler issues
config.resolver.platforms = ['ios', 'android', 'native'];

// Optimize for production builds
config.transformer.minifierConfig = {
  ecma: 8,
  keep_fnames: false,
  mangle: {
    keep_fnames: false,
  },
};

// Enable tree shaking
config.transformer.unstable_allowRequireContext = true;

module.exports = config;