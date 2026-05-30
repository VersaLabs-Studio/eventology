/**
 * Format a number as Ethiopian Birr (ETB).
 * @example formatETB(1500) → "ETB 1,500.00"
 */
export declare function formatETB(amount: number): string;
/**
 * Format an ISO date string to a human-readable date.
 * @example formatDate('2026-06-15T10:00:00Z') → "Jun 15, 2026"
 */
export declare function formatDate(iso: string): string;
/**
 * Format an ISO date string to date + time.
 * @example formatDateTime('2026-06-15T10:00:00Z') → "Jun 15, 2026 at 10:00 AM"
 */
export declare function formatDateTime(iso: string): string;
/**
 * Format an ISO date string to time only.
 * @example formatTime('2026-06-15T14:30:00Z') → "2:30 PM"
 */
export declare function formatTime(iso: string): string;
/**
 * Format an ISO date string as relative time ("2 hours ago", "in 3 days").
 * Handles past and future dates.
 */
export declare function formatRelativeTime(iso: string): string;
/**
 * Format an Ethiopian phone number to a standard display format.
 * Accepts various input formats and normalizes to "+251 9X XXX XXXX".
 * @example formatPhoneNumber('0911223344') → "+251 91 122 3344"
 * @example formatPhoneNumber('+251911223344') → "+251 91 122 3344"
 */
export declare function formatPhoneNumber(phone: string): string;
/**
 * Truncate text to a maximum length with ellipsis.
 */
export declare function truncate(text: string, maxLength: number): string;
/**
 * Generate a URL-friendly slug from a string.
 * @example slugify('Addis Tech Summit 2026!') → 'addis-tech-summit-2026'
 */
export declare function slugify(text: string): string;
//# sourceMappingURL=format.d.ts.map