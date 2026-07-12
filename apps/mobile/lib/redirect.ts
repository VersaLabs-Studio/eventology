// ============================================================================
// safeRedirect — validate a `?redirect=` param before navigating to it
// ============================================================================
// The auth screens accept a redirect target so a gated action (registering for
// an event) returns the user where they started. That param arrives from a
// route URL, and expo-router can be driven by an external deep link
// (`eventology://auth/login?redirect=…`), so it is untrusted input.
//
// Only same-app absolute paths are allowed. Anything scheme-ish, protocol-
// relative, or otherwise not starting with a single "/" falls back to home.
// ============================================================================

/** The tab bar's Discover screen. `(tabs)` is a route group and adds no segment. */
export const HOME_ROUTE = '/';

export function safeRedirect(target: unknown, fallback: string = HOME_ROUTE): string {
  if (typeof target !== 'string') return fallback;

  const value = target.trim();
  if (value.length === 0) return fallback;

  // Must be an absolute in-app path…
  if (!value.startsWith('/')) return fallback;
  // …but not protocol-relative ("//evil.com" is a valid URL to most parsers).
  if (value.startsWith('//')) return fallback;
  // Defence in depth: no scheme, no backslash tricks.
  if (value.includes(':') || value.includes('\\')) return fallback;

  return value;
}
