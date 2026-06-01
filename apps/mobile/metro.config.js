// apps/mobile/metro.config.js
// Workaround for @expo/metro-runtime@6.1.2 not declaring an "exports" field.
// Forces legacy subpath resolution so Metro finds rsc/runtime.js reliably
// regardless of the upstream package shape.
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

// Performance: persistent file-based cache so restarts don't re-bundle everything.
config.cacheStores = [
  new FileStore({ root: require('path').join(__dirname, '.metro-cache') }),
];

// Speed: tune transformer parallelism and minimize work per module.
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true, // hoists requires to the bottom, faster initial parse
  },
});

// Speed: tell Metro to use Hermes bytecode output (already default for SDK 54).
config.transformer.unstable_allowRequireContext = false;

module.exports = config;
