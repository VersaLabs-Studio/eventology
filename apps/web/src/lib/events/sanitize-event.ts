// ============================================================================
// Event Sanitizer — strip `online_url` from any non-host payload (HO-I)
// ============================================================================
// The virtual/hybrid meeting URL is a SECRET: only confirmed attendees and
// hosts may see it. 046 adds the column to `events`, and many existing
// routes select `*` from events — the column would ride along in every
// payload. Every route that returns event rows to non-hosts passes them
// through `stripOnlineUrl` / `stripOnlineUrlDeep`.
//
// Gated reveal happens ONLY in /api/protected/events/[id]/join-link.
// ============================================================================

/** Rows that carry the events table's online_url column. */
interface WithOnlineUrl {
  online_url?: unknown;
  online_provider?: unknown;
}

/**
 * Strips online_url (and keeps provider only when a URL exists — provider
 * alone leaks nothing, but for consistency we null it with the URL).
 * Returns a shallow copy; the input row is never mutated.
 */
export function stripOnlineUrl<T extends object>(row: T): T {
  const r = row as WithOnlineUrl;
  if (r.online_url === undefined && r.online_provider === undefined) {
    return row;
  }
  return { ...row, online_url: null, online_provider: null } as T;
}

/**
 * Recursively strips online_url from any event object embedded anywhere in
 * a payload (`events(...)` joins inside collection_items, saved_events,
 * feed_activities, etc.). Walks arrays and plain objects; safe on cyclic-
 * free JSON shapes (API responses).
 */
export function stripOnlineUrlDeep<T>(payload: T): T {
  if (Array.isArray(payload)) {
    return payload.map((item) => stripOnlineUrlDeep(item)) as unknown as T;
  }
  if (payload !== null && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      out[key] =
        key === 'online_url' || key === 'online_provider'
          ? null
          : stripOnlineUrlDeep(obj[key]);
    }
    return out as T;
  }
  return payload;
}
