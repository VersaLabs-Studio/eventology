// apps/mobile/metro.config.js
// Workspace-resolved Metro config. The mobile app imports @eventology/*
// from the monorepo's packages/ directory; we use the standard
// monorepo-aware Metro setup.
const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..', '..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo packages
config.watchFolders = [monorepoRoot];

// React must be a singleton in the bundle.
//
// apps/web depends on react ^19.2.6 (Next 16), so npm hoists react@19.2.7 to the
// repo root. Expo SDK 54 pins react@19.1.0, which npm therefore keeps nested in
// apps/mobile/node_modules. But `react-native` itself hoists to the root, so its
// Fabric renderer resolves the ROOT react (19.2.7) while expo-router — nested —
// resolves the mobile react (19.1.0). Two React copies in one bundle means
// `resolveDispatcher()` returns null and every hook throws:
//   "Invalid hook call" / "Cannot read property 'useMemo' of null"
//
// Aligning versions is not an option: 19.1.0 breaks Next 16 on web, and 19.2.7
// pairs RN 0.81.5's renderer with React internals it wasn't compiled against.
// So pin only the React packages, only for this app's bundle, to the SDK-54 copy
// under apps/mobile. Web keeps 19.2.7; nothing else is affected.
//
// Pinning is surgical on purpose. `disableHierarchicalLookup` would also collapse
// react, but it breaks legitimately-nested deps (e.g. expo-router's own
// @expo/metro-runtime), so normal resolution is left alone for everything else.
const REACT_SINGLETONS = ['react', 'react-dom'].filter((name) =>
  fs.existsSync(path.resolve(projectRoot, 'node_modules', name)),
);

const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
  ],
  // Package "exports" resolution — Expo SDK 54's default. Must stay enabled:
  // better-auth (and other modern packages) expose subpaths like
  // `better-auth/react` only via their exports map. Disabling it makes Metro
  // fail to resolve those subpaths.
  unstable_enablePackageExports: true,
  resolveRequest: (context, moduleName, platform) => {
    const pinned = REACT_SINGLETONS.find(
      (name) => moduleName === name || moduleName.startsWith(`${name}/`),
    );

    if (pinned) {
      // Rewrite `react` / `react/jsx-runtime` / `react-dom/client` to an absolute
      // path inside apps/mobile so every importer, wherever it was hoisted to,
      // lands on the same module instance.
      const subpath = moduleName.slice(pinned.length);
      const target = path.resolve(projectRoot, 'node_modules', pinned) + subpath;
      return context.resolveRequest(context, target, platform);
    }

    return (upstreamResolveRequest ?? context.resolveRequest)(
      context,
      moduleName,
      platform,
    );
  },
};

module.exports = config;
