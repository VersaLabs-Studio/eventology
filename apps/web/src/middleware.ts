import { getSessionCookie } from 'better-auth/cookies';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Edge-runtime middleware. Coarse-grained auth only.
 *
 * ── Why `getSessionCookie` and not `auth.api.getSession`? ────────────
 * `auth.api.getSession` (database mode) hits the `pg` driver, which
 * transitively imports `node:util/types`, `fs`, `path`, `net`, `tls`, etc.
 * The Edge runtime does not provide those built-ins, so any import of the
 * Node-only `auth` instance from a module middleware can reach will crash
 * at module evaluation with `Native module not found: node:util/types`.
 *
 * `getSessionCookie` (from `better-auth/cookies`) reads the signed session
 * cookie from the request headers only — no DB roundtrip, no Node built-ins,
 * fully Edge-safe. The full session validation (DB lookup + role fetch)
 * happens in the server-component layouts under `(organizer)` and `(admin)`
 * and in the `/api/protected/**` route handlers, all of which run on the
 * Node runtime.
 *
 * Route Protection Matrix:
 * ┌─────────────────────┬──────────────────────────────────────────────┐
 * │ Route Prefix        │ Required                                    │
 * ├─────────────────────┼──────────────────────────────────────────────┤
 * │ / (home)            │ Public                                      │
 * │ /events/*           │ Public                                      │
 * │ /search             │ Public                                      │
 * │ /auth/*             │ Public                                      │
 * │ /api/public/*       │ Public                                      │
 * │ /api/webhooks/*     │ Public                                      │
 * │ /org/*              │ organizer or admin  (enforced in layout)    │
 * │ /admin/*            │ admin             (enforced in layout)    │
 * │ /api/protected/*    │ Authenticated     (enforced in route)     │
 * │ /my-events/*        │ Authenticated     (enforced in layout)    │
 * └─────────────────────┴──────────────────────────────────────────────┘
 */
export async function middleware(req: NextRequest) {
  const sessionToken = getSessionCookie(req, {
    cookieName: 'session_token',
    cookiePrefix: 'better-auth',
  });
  const path = req.nextUrl.pathname;

  // ── Public Routes (no auth required) ──────────────────────────────
  const publicPaths = [
    '/',
    '/events',
    '/search',
    '/auth',
    '/api/public',
    '/api/webhooks',
  ];
  const isPublicRoute = publicPaths.some(
    (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`)
  );
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ── Auth Required (all other routes) ──────────────────────────────
  if (!sessionToken) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // Role checks for /org/* and /admin/* are enforced server-side in the
  // matching route-group layouts (Node runtime, can query the DB).
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
