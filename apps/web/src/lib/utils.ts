import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DEFAULT_LOCALE, type Locale } from "@eventology/locales";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Locale-aware formatters (R3 / A2)
// ---------------------------------------------------------------------------
// Default to English so server-rendered components and pre-hydration
// calls produce the same string the client will. Components that have
// the i18n context can override via the `locale` param.
// ---------------------------------------------------------------------------

function resolveLocaleTag(locale: Locale | string | undefined | null): string {
  if (!locale) return 'en-US';
  // We only ship en + am. Map them to BCP 47 tags that Intl accepts.
  switch (locale) {
    case 'am':
      return 'am-ET';
    case 'en':
    default:
      return 'en-US';
  }
}

function resolveCurrencyForLocale(locale: Locale | string | undefined | null): string {
  // Default platform currency is ETB. We don't switch per locale — the
  // product is Ethiopia-specific — but this hook is here for the day we
  // need to fan out into other markets.
  return 'ETB';
}

export function formatDate(
  date: Date | string,
  locale: Locale | string | null = DEFAULT_LOCALE
): string {
  return new Date(date).toLocaleDateString(resolveLocaleTag(locale), {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(
  date: Date | string,
  locale: Locale | string | null = DEFAULT_LOCALE
): string {
  return new Date(date).toLocaleTimeString(resolveLocaleTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(
  amount: number,
  locale: Locale | string | null = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(resolveLocaleTag(locale), {
    style: "currency",
    currency: resolveCurrencyForLocale(locale),
    minimumFractionDigits: 2,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
