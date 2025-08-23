const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// إعدادات إضافية للتطبيق
config.resolver.alias = {
  '@': './src',
};

module.exports = config;