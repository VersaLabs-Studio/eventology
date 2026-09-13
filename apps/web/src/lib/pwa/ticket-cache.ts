'use client';

// ============================================================================
// Ticket Cache — per-user offline storage for ticket payloads (HO-L)
// ============================================================================
// Security model (LOCKED):
//   - Cache partition is per-USER: every bucket is namespaced
//     `eventology-tickets-<profileId>` and every entry carries profileId.
//     Reads verify the entry's profileId against the active partition;
//     sign-out deletes the whole bucket (never serve user A's ticket to B).
//   - Storage = Cache API (`caches`), same storage the SW uses, so entries
//     survive reloads and work offline. We use a JSON Response as the
//     stored body — values are read back with .json().
//   - Eviction: max-age (default 24h) AND qr_version mismatch on reconnect.
//     A transferred ticket's version changes server-side (HO-G), so the
//     stale cached QR fails the version check and is evicted — it cannot
//     remain scannable offline after a transfer.
// ============================================================================

import type { CachedTicket } from './types';

/** Default entry lifetime before the reconnect revalidation evicts it. */
export const TICKET_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Active per-user partition id (profile id), set on sign-in. */
let activePartition: string | null = null;

export function setTicketCachePartition(profileId: string | null): void {
  activePartition = profileId;
}

function bucketName(): string | null {
  return activePartition ? `eventology-tickets-${activePartition}` : null;
}

/** Test/SSR guard: Cache API is browser-only. */
async function openBucket(): Promise<Cache | null> {
  const name = bucketName();
  if (!name || typeof caches === 'undefined') return null;
  return caches.open(name);
}

/** True when the entry is within its max-age window. */
function isFresh(entry: CachedTicket, maxAgeMs: number): boolean {
  const age = Date.now() - new Date(entry.cachedAt).getTime();
  return Number.isFinite(age) && age >= 0 && age < maxAgeMs;
}

/**
 * Store a ticket payload for offline use. Call after a successful online
 * fetch of /api/protected/tickets/[id].
 */
export async function putTicket(
  ticketId: string,
  payload: {
    qr_data: string;
    qr_version?: number;
    status?: string;
    id?: string;
  },
  maxAgeMs: number = TICKET_CACHE_MAX_AGE_MS
): Promise<void> {
  const cache = await openBucket();
  if (!cache || !activePartition) return;

  // Invalid tickets are never cached — a cancelled/used ticket has no
  // offline value and must not appear scannable.
  if (payload.status && payload.status !== 'valid') return;

  const entry: CachedTicket = {
    ticketId,
    profileId: activePartition,
    qrPayload: payload.qr_data,
    qrVersion: payload.qr_version ?? 1,
    cachedAt: new Date().toISOString(),
    payload,
  };

  await cache.put(
    ticketCacheKey(ticketId),
    new Response(JSON.stringify(entry), {
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

/**
 * Read a cached ticket. Validates partition ownership + freshness.
 * Returns null when absent, stale, evicted, or owned by another partition.
 */
export async function getTicket(
  ticketId: string,
  maxAgeMs: number = TICKET_CACHE_MAX_AGE_MS
): Promise<CachedTicket | null> {
  const cache = await openBucket();
  if (!cache) return null;

  const stored = await cache.match(ticketCacheKey(ticketId));
  if (!stored) return null;

  let entry: CachedTicket;
  try {
    entry = (await stored.json()) as CachedTicket;
  } catch {
    await cache.delete(ticketCacheKey(ticketId));
    return null;
  }

  // Cross-user guard (defense in depth over partitioning): a bucket should
  // only ever contain its own profile's rows.
  if (!activePartition || entry.profileId !== activePartition) {
    await cache.delete(ticketCacheKey(ticketId));
    return null;
  }

  if (!isFresh(entry, maxAgeMs)) {
    await cache.delete(ticketCacheKey(ticketId));
    return null;
  }

  return entry;
}

/**
 * Reconnect revalidation: evict when the cached qr_version no longer
 * matches the server's current version (HO-G transfer rotated it).
 * Call with the fresh server row after coming back online.
 */
export async function evictIfVersionChanged(
  ticketId: string,
  serverVersion: number | undefined
): Promise<void> {
  if (serverVersion === undefined) return;
  const cache = await openBucket();
  if (!cache) return;

  const stored = await cache.match(ticketCacheKey(ticketId));
  if (!stored) return;

  try {
    const entry = (await stored.json()) as CachedTicket;
    if (entry.qrVersion !== serverVersion) {
      await cache.delete(ticketCacheKey(ticketId));
    }
  } catch {
    await cache.delete(ticketCacheKey(ticketId));
  }
}

/**
 * Evict a single entry (e.g. the server DENIED access while online — the
 * transfer case: the ticket no longer belongs to this user, so the cached
 * QR must not survive for offline use).
 */
export async function evictTicket(ticketId: string): Promise<void> {
  const cache = await openBucket();
  if (!cache) return;
  await cache.delete(ticketCacheKey(ticketId));
}

/**
 * Sign-out cleanup — deletes the caller's ENTIRE ticket bucket so no
 * ticket data survives an account switch. Called from the sign-out flow.
 */
export async function clearTicketCache(): Promise<void> {
  const name = bucketName();
  if (name && typeof caches !== 'undefined') {
    await caches.delete(name);
  }
  activePartition = null;
}

/** Ticket entries live under a stable in-bucket key. */
function ticketCacheKey(ticketId: string): string {
  return `/__ticket-cache/${ticketId}`;
}
