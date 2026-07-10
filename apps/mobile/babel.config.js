// In this npm-workspaces monorepo, `babel-preset-expo` is hoisted to the repo
// root, while `expo-router` stays nested under apps/mobile (its react/react-native
// peers differ from the web app's react at the root, so npm keeps the whole RN
// subtree nested). babel-preset-expo gates its expo-router transform behind
// `hasModule('expo-router')` — a bare `require.resolve('expo-router')` from the
// hoisted location, which cannot see the nested package — so it silently skips
// inlining `EXPO_ROUTER_APP_ROOT`. The dev server injects that value at runtime
// so `expo start` works, but release/export bundles (the EAS "Bundle JavaScript"
// phase / `expo export`) get an un-inlined `require.context(process.env.…)` and
// fail with "First argument of require.context should be a string".
//
// Fix: register the exact same plugin explicitly. It computes the app-root path
// per-file (so it's correct regardless of where the package is hoisted), and if
// babel-preset-expo's own copy ever does run, the second pass is a harmless no-op
// (the process.env member expression has already been replaced with a literal).
const { expoRouterBabelPlugin } = require('babel-preset-expo/build/expo-router-plugin');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [expoRouterBabelPlugin],
  };
};
