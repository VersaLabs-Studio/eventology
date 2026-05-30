/**
 * Validate an Ethiopian phone number.
 * Accepts:
 * - Local format: 09XXXXXXXX (10 digits starting with 09)
 * - International: +2519XXXXXXXX (12 digits starting with +2519)
 * - Also accepts 07XXXXXXXX (Ethio Telecom mobile)
 */
export declare function isValidEthiopianPhone(phone: string): boolean;
/**
 * Validate an email address (RFC 5322 simplified).
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate a URL string.
 */
export declare function isValidUrl(url: string): boolean;
/**
 * Check if a string is a valid UUID v4.
 */
export declare function isValidUUID(value: string): boolean;
/**
 * Check if a date string is in the future.
 */
export declare function isFutureDate(iso: string): boolean;
/**
 * Check if a date string is in the past.
 */
export declare function isPastDate(iso: string): boolean;
/**
 * Validate that end date is after start date.
 */
export declare function isValidDateRange(startIso: string, endIso: string): boolean;
/**
 * Validate password strength (minimum 8 chars, uppercase, lowercase, digit).
 */
export declare function isStrongPassword(password: string): boolean;
//# sourceMappingURL=validators.d.ts.map