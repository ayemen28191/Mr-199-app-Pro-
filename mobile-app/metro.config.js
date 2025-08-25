const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add any custom Metro configuration here
config.resolver.alias = {
  '@': './src',
};

// Fix for Metro bundler issues
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;