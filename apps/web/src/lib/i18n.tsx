// ============================================================================
// @eventology/web — i18n Provider + Hook
// ============================================================================
// R3 / A2: locale-aware rendering for the web app. Persists the user's
// choice in a cookie (SSR-aware) + mirrors it to localStorage (client
// quick-read). The catalog is shared with mobile via @eventology/locales.
//
// Pattern:
//   - <I18nProvider> in app/layout.tsx reads the cookie and seeds the
//     initial value once (SSR-safe).
//   - `useLocale()` returns `{ t, locale, setLocale, ready }` for every
//     client component.
//   - `t(key)` is a dot-path resolver that falls back to the key string
//     when a translation is missing — same contract as mobile.
//
// We deliberately do NOT replace every literal in the codebase in one
// pass. The brain audit can pick up the long tail; this rotation wires
// the switcher, completes the Amharic catalog, and threads the
// highest-visibility R1/R2 strings through `t()`.
// ============================================================================

"use client";

import * as React from "react";
import { getTranslations, LOCALES, LOCALE_NAMES, DEFAULT_LOCALE, type Locale } from "@eventology/locales";
import en from '@eventology/locales/src/en.json';
import type enType from '@eventology/locales/src/en.json';

export type Translations = typeof enType;

const COOKIE_KEY = "eventology:locale";
const STORAGE_KEY = "eventology:locale";

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getNestedValue(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let cursor: unknown = obj;
  for (const part of parts) {
    if (cursor && typeof cursor === 'object' && part in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof cursor === 'string' ? cursor : undefined;
}

/**
 * Substitute `{{key}}` placeholders in a translation template.
 * Unknown placeholders are left as-is so the key is visible in dev.
 */
function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (match, key: string) => {
    if (key in values) return String(values[key]);
    return match;
  });
}

export interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  ready: boolean;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  /** SSR seed — read from the cookie by the root layout. */
  initialLocale?: Locale;
  children: React.ReactNode;
}

export function I18nProvider({ initialLocale, children }: I18nProviderProps) {
  // Start with the SSR-resolved locale to avoid hydration flicker.
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale ?? DEFAULT_LOCALE);
  const [ready, setReady] = React.useState(false);

  // On the client, prefer any newer cookie/localStorage value (the user
  // may have switched since the SSR render). Falls back to the seeded
  // initial locale if no client preference is set.
  React.useEffect(() => {
    let stored: string | null = null;
    try {
      stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    } catch {
      // localStorage may be disabled — non-fatal
    }
    if (!stored) stored = readCookie(COOKIE_KEY);
    if (stored && (LOCALES as readonly string[]).includes(stored)) {
      setLocaleState(stored as Locale);
    }
    setReady(true);
  }, []);

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      writeCookie(COOKIE_KEY, l, 365);
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // Best-effort — non-blocking
    }
    // The cookie write is enough to drive the NEXT request's SSR seed.
    // The current render is already in flight; React will re-render
    // because `locale` is a state dep.
  }, []);

  const translations = React.useMemo<Translations>(() => getTranslations(locale) as Translations, [locale]);

  const t = React.useCallback(
    (key: string, values?: Record<string, string | number>): string => {
      const raw = getNestedValue(translations, key) ?? key;
      return interpolate(raw, values);
    },
    [translations]
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t, ready }),
    [locale, setLocale, t, ready]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    // Defensive: a server-rendered component that was never wrapped in
    // <I18nProvider> gets the default English catalog. Better than
    // throwing — keeps SSR simple.
    const t = (key: string) => key;
    return { locale: DEFAULT_LOCALE, setLocale: () => {}, t, ready: false };
  }
  return ctx;
}

export { LOCALES, LOCALE_NAMES, DEFAULT_LOCALE };
export type { Locale };
