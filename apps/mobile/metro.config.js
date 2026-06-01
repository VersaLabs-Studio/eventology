// apps/mobile/metro.config.js
// Workaround for @expo/metro-runtime@6.1.2 not declaring an "exports" field.
// Forces legacy subpath resolution so Metro finds rsc/runtime.js reliably
// regardless of the upstream package shape.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

module.exports = config;
