// ============================================================================
// PWA — Offline ticket cache types (HO-L)
// ============================================================================

/**
 * One cached ticket entry — stored verbatim from the ALREADY-ISSUED server
 * payload. The client never generates, signs, or derives a QR/HMAC
 * (LOCKED: the HMAC secret stays server-side; HO-G's versioned rotation
 * depends on it).
 */
export interface CachedTicket {
  ticketId: string;
  /** Cache partition owner — buckets are namespaced by profile id. */
  profileId: string;
  /** The server-issued QR payload (tickets.qr_data), cached as-is. */
  qrPayload: string;
  /** tickets.qr_version at cache time — a transfer rotates the version. */
  qrVersion: number;
  /** ISO timestamp of the cache write — surfaced as "last synced". */
  cachedAt: string;
  /**
   * The full ticket API payload captured at cache time. Spec's CachedTicket
   * is the minimum shape; rendering offline needs the event/registration
   * joins TicketView displays, so the response body is kept alongside
   * (documented assumption).
   */
  payload: unknown;
}
