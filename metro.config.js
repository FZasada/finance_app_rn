const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure platform-specific file extensions
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Platform-specific file resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;