// ============================================================================
// @eventology/web — Feature Flags
// ============================================================================
// Single source of truth for runtime feature flags. All components/pages
// MUST go through these helpers — never read `process.env` directly in
// component code.
//
// Why a flag helper?
//   1. Single import surface — easy to grep/audit.
//   2. Type-safe reads + sensible defaults (no stringly-typed booleans).
//   3. Centralised audit trail — when we add a new flag, it lands here.
//   4. SSR-safe — reads once on the server, mirrors to the client via the
//      `NEXT_PUBLIC_*` env convention used by Next.js.
// ============================================================================

/**
 * Payments toggle (R3, required).
 *
 * When `false` (the MVP default):
 *   - The registration page disables every paid tier and shows a
 *     "Tickets on sale soon" badge. Free tiers remain selectable.
 *   - The event detail page suppresses the "From X" price badge.
 *   - The revenue / payout / commission UIs are hidden from navigation
 *     and replaced with a "Payments coming soon" placeholder.
 *   - The Chapa webview path is unreachable.
 *   - The free path of the registration API still works (status=
 *     confirmed, ticket issued immediately).
 *
 * When `true` (post-MVP): the full paid flow is restored with zero code
 * changes — the provider seam, the webhooks, and the RPCs remain live.
 *
 * Read via `paymentsEnabled()`. Server components / API routes can also
 * import `paymentsEnabledServer()` to read server-only env if we ever
 * decouple the client flag from the server authorization.
 */
export function paymentsEnabled(): boolean {
  // Default is FALSE — MVP ships with payments disabled. Setting the env
  // var to the literal "true" (case-insensitive) is the only opt-in.
  const raw = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED;
  if (!raw) return false;
  return raw.trim().toLowerCase() === 'true';
}

/**
 * Server-only payments toggle. Mirrors the client flag for consistency.
 * Use this in API routes that must refuse the paid path. In V1 there
 * is no server-only override — the two read the same value.
 */
export function paymentsEnabledServer(): boolean {
  return paymentsEnabled();
}
