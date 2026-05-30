// ============================================================================
// @eventology/utils — Formatting Utilities
// ============================================================================
/**
 * Format a number as Ethiopian Birr (ETB).
 * @example formatETB(1500) → "ETB 1,500.00"
 */
export function formatETB(amount) {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}
/**
 * Format an ISO date string to a human-readable date.
 * @example formatDate('2026-06-15T10:00:00Z') → "Jun 15, 2026"
 */
export function formatDate(iso) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(iso));
}
/**
 * Format an ISO date string to date + time.
 * @example formatDateTime('2026-06-15T10:00:00Z') → "Jun 15, 2026 at 10:00 AM"
 */
export function formatDateTime(iso) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
        .format(new Date(iso))
        .replace(',', ' at');
}
/**
 * Format an ISO date string to time only.
 * @example formatTime('2026-06-15T14:30:00Z') → "2:30 PM"
 */
export function formatTime(iso) {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(iso));
}
/**
 * Format an ISO date string as relative time ("2 hours ago", "in 3 days").
 * Handles past and future dates.
 */
export function formatRelativeTime(iso) {
    const now = Date.now();
    const target = new Date(iso).getTime();
    const diffMs = target - now;
    const absDiff = Math.abs(diffMs);
    const isPast = diffMs < 0;
    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    let value;
    let unit;
    if (seconds < 60) {
        value = seconds;
        unit = 'second';
    }
    else if (minutes < 60) {
        value = minutes;
        unit = 'minute';
    }
    else if (hours < 24) {
        value = hours;
        unit = 'hour';
    }
    else if (days < 7) {
        value = days;
        unit = 'day';
    }
    else if (weeks < 4) {
        value = weeks;
        unit = 'week';
    }
    else {
        value = months;
        unit = 'month';
    }
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    return rtf.format(isPast ? -value : value, unit);
}
/**
 * Format an Ethiopian phone number to a standard display format.
 * Accepts various input formats and normalizes to "+251 9X XXX XXXX".
 * @example formatPhoneNumber('0911223344') → "+251 91 122 3344"
 * @example formatPhoneNumber('+251911223344') → "+251 91 122 3344"
 */
export function formatPhoneNumber(phone) {
    // Strip all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Handle local format (09XXXXXXXX)
    if (digits.startsWith('09') && digits.length === 10) {
        const national = digits.slice(1); // Remove leading 0
        return `+251 ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
    }
    // Handle international format (2519XXXXXXXX)
    if (digits.startsWith('2519') && digits.length === 12) {
        const national = digits.slice(3); // Remove 251
        return `+251 ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
    }
    // Return original if format not recognized
    return phone;
}
/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength).trimEnd() + '…';
}
/**
 * Generate a URL-friendly slug from a string.
 * @example slugify('Addis Tech Summit 2026!') → 'addis-tech-summit-2026'
 */
export function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
//# sourceMappingURL=format.js.map