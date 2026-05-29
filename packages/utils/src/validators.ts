// ============================================================================
// @eventology/utils — Validation Utilities
// ============================================================================

/**
 * Validate an Ethiopian phone number.
 * Accepts:
 * - Local format: 09XXXXXXXX (10 digits starting with 09)
 * - International: +2519XXXXXXXX (12 digits starting with +2519)
 * - Also accepts 07XXXXXXXX (Ethio Telecom mobile)
 */
export function isValidEthiopianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s()-]/g, '');

  // +251 9XX XXX XXXX or +251 7XX XXX XXXX
  if (/^\+251[79]\d{8}$/.test(cleaned)) return true;

  // 09XX XXX XXXX or 07XX XXX XXXX
  if (/^0[79]\d{8}$/.test(cleaned)) return true;

  return false;
}

/**
 * Validate an email address (RFC 5322 simplified).
 */
export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
    email
  );
}

/**
 * Validate a URL string.
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a string is a valid UUID v4.
 */
export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Check if a date string is in the future.
 */
export function isFutureDate(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
}

/**
 * Check if a date string is in the past.
 */
export function isPastDate(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

/**
 * Validate that end date is after start date.
 */
export function isValidDateRange(startIso: string, endIso: string): boolean {
  return new Date(endIso).getTime() > new Date(startIso).getTime();
}

/**
 * Validate password strength (minimum 8 chars, uppercase, lowercase, digit).
 */
export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
