// ============================================================================
// Eventology Service Worker (HO-L) — HAND-ROLLED, zero dependencies
// ============================================================================
// LOCKED constraints encoded here:
//   - NO workbox/next-pwa — this file is the whole strategy.
//   - Explicit caching, never blanket:
//       * Static assets (/_next/static, icons, images) → cache-first.
//       * Ticket page NAVIGATION HTML (/ticket/…) → stale-while-revalidate,
//         so a previously-viewed ticket page shell survives offline.
//       * Everything else → network passthrough, NO offline fallback.
//   - /api/auth/* is NEVER intercepted (better-auth must always hit the
//     network; also the SW never caches credentials).
//   - /api/* is NEVER cached by the SW. The offline ticket payload is
//     served from the PER-USER application-layer partition
//     (src/lib/pwa/ticket-cache.ts — bucket namespaced by profile id,
//     cleared on sign-out). The SW has no role in cross-user isolation
//     because it stores no user data at all.
//   - Update flow: a new worker installs and WAITS; the page prompts the
//     user; accepting posts SKIP_WAITING, and the page reloads on
//     controllerchange. Users are never silently stranded on a stale build.
// ============================================================================

/* eslint-disable no-restricted-globals */

const VERSION = 'v1';
const SHELL_CACHE = `eventology-shell-${VERSION}`;
const STATIC_CACHE = `eventology-static-${VERSION}`;
const TICKET_PAGES_CACHE = `eventology-ticket-pages-${VERSION}`;

self.addEventListener('install', () => {
  // No precache list — runtime caching only keeps the SW dep-free and the
  // first visit cheap. The old worker keeps serving until the user accepts
  // the update prompt (skipWaiting is message-driven, not install-driven).
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Evict caches from older versions of this SW.
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) =>
              name.startsWith('eventology-shell-') ||
              name.startsWith('eventology-static-') ||
              name.startsWith('eventology-ticket-pages-')
          )
          .filter((name) => name !== SHELL_CACHE && name !== STATIC_CACHE && name !== TICKET_PAGES_CACHE)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only same-origin GETs are ever cached; everything else passes through.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // LOCKED: never intercept auth routes.
  if (url.pathname.startsWith('/api/auth/')) return;

  // LOCKED: the SW caches NO API responses (per-user ticket data lives in
  // the application-layer partition instead).
  if (url.pathname.startsWith('/api/')) return;

  // 1) Static assets → cache-first.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/logo.png' ||
    url.pathname === '/logo.webp' ||
    url.pathname === '/logo.svg'
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 2) Ticket page navigation HTML → stale-while-revalidate. The page HTML
  //    is the generic app shell (ticket data is client-fetched), so caching
  //    it per-URL carries no user data.
  if (request.mode === 'navigate' && url.pathname.startsWith('/ticket/')) {
    event.respondWith(staleWhileRevalidate(request, TICKET_PAGES_CACHE));
    return;
  }

  // 3) Everything else → network passthrough (no offline fallback).
});

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  // Fresh out of cache while the network refreshes in the background.
  if (cached) {
    return cached;
  }

  const response = await network;
  return response || Response.error();
});
