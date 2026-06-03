# Session Log — MVP-Demo Runtime Fixes (Expo Go boot failure)

**Date:** 2026-06-03
**Branch/worktree:** `mvp-demo` (mobile-only worktree at `apps/mobile`)
**Context:** App got stuck on Expo Go at "bundling 100%" even though Metro reported a
successful bundle. Web also appeared broken. Multiple prior agent attempts did not fix it.

---

## TL;DR

There was never one bug. **Three independent bleeding-edge problems** stacked and produced
overlapping symptoms that all looked like "stuck bundling":

1. **`react-native-worklets` JS↔native version mismatch** → the real native hang. **FIXED & verified loading on device.**
2. **"Web doesn't work"** → not actually broken; the dev server was crash-looping (see #3). Web bundles clean.
3. **Node 25 (non-LTS)** breaking Expo's ngrok tunnel → the whole `expo start` aborted, so neither QR nor web served. **Guardrail added.**

---

## Problem 1 — Native hang (root cause of "stuck at 100%") — FIXED

- Metro genuinely finished bundling (`Android Bundled … 1487 modules`). The failure was at
  **runtime on the device**, during JS execution — not in the bundler.
- Reanimated 4 moved its engine into a separate package, `react-native-worklets`.
- `react-native-reanimated@4.1.7` declares `react-native-worklets: "0.5 - 0.8"`, so npm
  installed the newest in range → **0.8.3**.
- Expo Go (SDK 54) ships the **native** worklets module pinned at **0.5.1**.
- Version skew: `0.8.3` JS calls the native bridge as `installTurboModule(arg)` (1 arg); the
  `0.5.1` native side expects 0 args → runtime crash:
  `Exception in HostFunction: TurboModule method "installTurboModule" called with 1 arguments (expected argument count: 0)`.
- This threw while **expo-router eagerly `require()`s every screen** to build its route table.
  Any screen with a top-level `import … from "react-native-reanimated"` (Toast, Card, Button,
  Skeleton, SearchBar, discover, event/[slug], etc.) takes the whole app down before first paint.
  The follow-on `Cannot read property 'ToastProvider' of undefined` was **collateral** (Toast.tsx
  imports reanimated, which threw at module init, so its exports came back undefined).

**Fix:** pinned `react-native-worklets` to the SDK-matched version.
```
cd apps/mobile && npx expo install react-native-worklets   # → 0.5.1, deduped under reanimated
```
`package.json` now has `"react-native-worklets": "0.5.1"`. `npx expo install --check` → "Dependencies are up to date." **User confirmed the app loads on Expo Go after this change.**

## Problem 2 — "Web doesn't work" — NOT broken

- Headless web build succeeded cleanly: `npx expo export -p web` → 1083 modules, 2.37 MB JS, 0 errors.
- Web only *appeared* broken because the tunnel crash (Problem 3) aborted the entire `expo start`
  process — when the dev server dies, nothing serves: not the native QR, not `localhost:8081`.
- Building web added `react-native-web@^0.21.0` (the standard Expo web-target dep, SDK-aligned).
  Kept so `w` / web preview works.

## Problem 3 — Tunnel crash — Node 25

- Errors seen: `CommandError: TypeError: Cannot read properties of undefined (reading 'body')`,
  `failed to start tunnel`, `remote gone away`. These come from Expo's ngrok integration, **not**
  ngrok's servers.
- Machine was on **Node v25.1.0** (non-LTS, bleeding edge). Expo SDK 54 targets Node 20/22 LTS.
- A tunnel failure aborts `expo start` entirely → cascades into "web doesn't work" too.

**Guardrail added (this session):**
- `apps/mobile/.nvmrc` → `22.19.0`
- `apps/mobile/package.json` → `"engines": { "node": ">=20 <23" }`

**Per-session command:** `nvm use 22.19.0` before running Expo (nvm-windows: `nvm use 22.19.0`).
Installed LTS versions available on this machine: 22.19.0, 20.9.0.

---

## Why this never happened on previous projects

Three first-time-for-Kidus choices compounded:
1. **Reanimated 4 + New Architecture + the new split `react-native-worklets` package** with a loose
   version range — a failure mode unique to the SDK 54 era. Reanimated 2/3 bundled worklets in and
   version-locked it.
2. **Nested non-workspace layout:** repo root is a **Next.js 16** web app with its own `node_modules`
   (`react@19.2.6`); Expo is nested at `apps/mobile` (`react@19.1.0`). No `workspaces` field, so Metro
   resolves by walking *up* the tree. It happens to be fine for React today (mobile's own copy wins —
   verified no `react-native`/`expo` at root), but it's fragile.
3. **Node 25** — fine for Next.js, toxic to Expo's tunnel.

---

## Recommended workflow going forward

```bash
nvm use 22.19.0                 # once per terminal session, before Expo
cd apps/mobile

# Your own dev session (look around / iterate): LAN is fastest + reliable
npx expo start -c               # press w for web; scan QR with iPhone on the SAME Wi-Fi
                                # (-c clears Metro cache; only needed after dep changes)

# Sharing with a REMOTE teammate's iPhone (different network) → tunnel, now stable on Node 22
npx expo start --tunnel -c
```

Notes:
- A `--tunnel` session only works **while your PC keeps the server running**. For a teammate to open
  the demo on their own schedule without your laptop live, the proper tool is an **EAS Update preview
  build** — more setup, deferred unless needed.
- `metro.config.js` uses a persistent `.metro-cache` FileStore, so after any dependency change you
  must start with `-c` once or the stale bundle is re-served.

---

## Verified state at end of session

- ✅ Native: worklets pinned to 0.5.1; app loads on Expo Go (user-confirmed).
- ✅ Web: bundles clean (1083 modules); will serve when dev server stays up.
- ✅ Tunnel: Node guardrail added (`.nvmrc` + `engines`); use Node 22.
- ✅ Committed and pushed to `origin/mvp-demo`.

## Files changed this session
- `apps/mobile/package.json` — pinned `react-native-worklets@0.5.1`; added `react-native-web@^0.21.0`; added `engines.node`.
- `apps/mobile/package-lock.json` — dedup/resolution for the above.
- `apps/mobile/.nvmrc` — `22.19.0` (new).
- `docs/SESSION_LOG_MVP_DEMO_RUNTIME_FIXES.md` — this file (new).
