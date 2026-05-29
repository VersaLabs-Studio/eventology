import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware for role-based route protection.
 * Uses better-auth's server-side session validation.
 *
 * Route Protection Matrix:
 * ┌─────────────────────┬─────────────────────────────────┐
 * │ Route Prefix        │ Required Role(s)                │
 * ├─────────────────────┼─────────────────────────────────┤
 * │ / (home)            │ Public                          │
 * │ /events/*           │ Public                          │
 * │ /search             │ Public                          │
 * │ /auth/*             │ Public                          │
 * │ /api/public/*       │ Public                          │
 * │ /api/webhooks/*     │ Public                          │
 * │ /org/*              │ organizer, admin                │
 * │ /admin/*            │ admin                           │
 * │ /api/protected/*    │ Any authenticated user          │
 * │ /my-events/*        │ Any authenticated user          │
 * └─────────────────────┴─────────────────────────────────┘
 */
export async function middleware(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
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
  if (!session) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // ── Organizer Routes ──────────────────────────────────────────────
  if (path.startsWith('/org') || path.startsWith('/api/protected')) {
    const allowedRoles = ['organizer', 'admin'];
    if (!allowedRoles.includes(session.user.role as string)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // ── Admin Routes ──────────────────────────────────────────────────
  if (path.startsWith('/admin')) {
    if (session.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
