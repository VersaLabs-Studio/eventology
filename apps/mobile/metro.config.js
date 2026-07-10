// apps/mobile/metro.config.js
// Workspace-resolved Metro config. The mobile app imports @eventology/*
// from the monorepo's packages/ directory; we use the standard
// monorepo-aware Metro setup.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Watch the monorepo packages
const projectRoot = __dirname;
const monorepoRoot = __dirname + '/../..';
config.watchFolders = [monorepoRoot];

// Force Metro to resolve modules from the monorepo root
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    projectRoot + '/node_modules',
    monorepoRoot + '/node_modules',
  ],
  // Package "exports" resolution — Expo SDK 54's default. Must stay enabled:
  // better-auth (and other modern packages) expose subpaths like
  // `better-auth/react` only via their exports map. Disabling it makes Metro
  // fail to resolve those subpaths.
  unstable_enablePackageExports: true,
};

module.exports = config;
