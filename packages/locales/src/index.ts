// ============================================================================
// @eventology/locales — Barrel Export
// ============================================================================

import en from './en.json';
import am from './am.json';

export { en, am };

/** Supported locale codes */
export const LOCALES = ['en', 'am'] as const;
export type Locale = (typeof LOCALES)[number];

/** Default locale */
export const DEFAULT_LOCALE: Locale = 'en';

/** Locale display names */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  am: 'አማርኛ',
};

/**
 * Get the translation object for a given locale.
 * Falls back to English if the locale is not found.
 */
export function getTranslations(locale: Locale): typeof en {
  const translations: Record<Locale, typeof en> = { en, am };
  return translations[locale] ?? en;
}
