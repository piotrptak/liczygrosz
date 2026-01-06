// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configure usage of SQLite on the web
config.resolver.sourceExts.push('sql'); // Ensure sql is treated as source if needed
// config.resolver.assetExts.push('db'); // db files are assets
// config.resolver.assetExts.push('wasm'); // wasm files are assets

// Correct way to handle expo-sqlite on web usually involves correct resolution
// For expo-sqlite/next (which is what usually uses wasm), we need to ensure wasm is an asset
const { resolver } = config;

config.resolver = {
    ...resolver,
    assetExts: [...resolver.assetExts, 'wasm', 'db', 'sqlite'],
};

module.exports = config;
