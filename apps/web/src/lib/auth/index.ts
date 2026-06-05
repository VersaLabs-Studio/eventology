/**
 * Auth module — public entry point.
 *
 * Re-exports the Node-runtime `auth` instance and the shared Edge-safe
 * `authOptions` so existing call sites (`@/lib/auth`) keep working.
 *
 * ── Runtime matrix ──────────────────────────────────────────────────
 * | Symbol        | Imported by                       | Runtime | Imports `pg`? |
 * |---------------|-----------------------------------|---------|---------------|
 * | `auth`        | API routes, server-component      | Node    | yes           |
 * |               | layouts, server actions           |         |               |
 * | `authOptions` | Anything that needs config only   | Both    | no            |
 *
 * If you need the full auth instance from a server-component layout, use
 * `auth`.  If you need the configuration object (e.g. for the cookie
 * prefix in a custom check), use `authOptions`.
 *
 * Edge middleware (`src/middleware.ts`) imports from `better-auth/cookies`
 * directly — never from this file.
 */
export { auth } from './server';
export { authOptions } from './options';
