/**
 * Eventology Mobile — Format Utilities
 * Centralized date, time, and currency formatters using `Intl`.
 * All formatters are locale-aware ('en-US' baseline) and safe for both
 * `Date` objects and ISO date strings. Time-of-day strings used in
 * mock data ("7:00 PM") are not parsed here — call sites that need to
 * combine a `time` field should do so explicitly.
 */

type DateInput = Date | string | number;

type DateStyle = "short" | "long" | "time" | "datetime";

const LOCALE = "en-US" as const;

const DATE_FORMATTERS: Record<Exclude<DateStyle, "time">, Intl.DateTimeFormat> = {
  short: new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }),
  long: new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }),
  datetime: new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }),
};

const TIME_FORMATTER = new Intl.DateTimeFormat(LOCALE, {
  hour: "numeric",
  minute: "2-digit",
});

const SHORT_RANGE_FORMATTER = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  day: "numeric",
});

/** Coerce a `Date | string | number` into a valid `Date`. */
function toDate(value: DateInput): Date {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}

/**
 * Format a date with the requested style.
 * - "short"    → "Mar 15, 2026"
 * - "long"     → "Sunday, March 15, 2026"
 * - "time"     → "7:00 PM"
 * - "datetime" → "Mar 15, 2026, 7:00 PM"
 */
export function formatDate(value: DateInput, style: DateStyle): string {
  const date = toDate(value);
  if (style === "time") {
    return TIME_FORMATTER.format(date);
  }
  return DATE_FORMATTERS[style].format(date);
}

/**
 * Format a monetary amount in Ethiopian Birr.
 * Uses 'en-US' digit grouping (1,250) with an `ETB` prefix per the
 * design system. `'en-ET'` lacks reliable runtime support, so the
 * fallback is intentional.
 */
export function formatCurrencyETB(amount: number): string {
  const formatter = new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: 0,
  });
  return `ETB ${formatter.format(amount)}`;
}

/**
 * Format a date relative to today using day-boundary comparisons in
 * the device's local timezone.
 * - Same calendar day → "Today"
 * - +1 day            → "Tomorrow"
 * - −1 day            → "Yesterday"
 * - Future            → "in 5d"
 * - Past              → "5d ago"
 */
export function formatRelativeDate(value: DateInput): string {
  const target = toDate(value);
  const now = new Date();

  const startOfDay = (d: Date): number =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const diffDays = Math.round((startOfDay(target) - startOfDay(now)) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1) return `in ${diffDays}d`;
  return `${Math.abs(diffDays)}d ago`;
}

/**
 * Format an event's start/end window.
 * - Same calendar day → "Mar 15, 7:00 PM"  (date + start time)
 * - Different days    → "Mar 15 — Mar 17"  (date range)
 * Callers needing to display the end time on a multi-day event should
 * do so explicitly — this function intentionally keeps the range
 * compact for cards and list rows.
 */
export function formatEventDateRange(start: DateInput, end: DateInput): string {
  const startDate = toDate(start);
  const endDate = toDate(end);

  const sameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  if (sameDay) {
    return `${SHORT_RANGE_FORMATTER.format(startDate)}, ${TIME_FORMATTER.format(startDate)}`;
  }
  return `${SHORT_RANGE_FORMATTER.format(startDate)} — ${SHORT_RANGE_FORMATTER.format(endDate)}`;
}
