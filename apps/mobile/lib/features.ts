// ============================================================================
// Eventology Mobile — Feature Flags
// ============================================================================
// Mirror of `apps/web/src/lib/config/features.ts` for the Expo client.
// Same flag (`EXPO_PUBLIC_PAYMENTS_ENABLED`) drives both clients so
// the gate is consistent across the web + mobile surfaces.
//
// EXPO_PUBLIC_* is the only env prefix Expo inlines into the client
// bundle. NEVER read server-only env from this helper.
// ============================================================================

/**
 * Payments toggle (R3, MVP default OFF).
 *
 * When false: the event detail screen filters out paid tiers, the
 * Chapa webview path is unreachable, and the free path takes the
 * ticket-immediate flow.
 *
 * When true: the full paid flow is restored with zero code changes —
 * the same webview path / mobile checkout flow stays in the tree.
 */
export function paymentsEnabled(): boolean {
  // Default is FALSE for the MVP. Setting the env var to the literal
  // "true" (case-insensitive) is the only opt-in.
  const raw = process.env.EXPO_PUBLIC_PAYMENTS_ENABLED;
  if (!raw) return false;
  return raw.trim().toLowerCase() === 'true';
}
