const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
defaultConfig.resolver.assetExts.push('bin');
defaultConfig.resolver.assetExts.push('mil');
defaultConfig.resolver.assetExts.push('mp3');

module.exports = defaultConfig;