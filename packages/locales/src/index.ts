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

/** Typed keys for comms templates. Keeps templates strongly typed. */
export type CommsTemplateKey =
  | 'registrationConfirmed'
  | 'ticketIssued'
  | 'paymentCompleted'
  | 'refundProcessed'
  | 'payoutUpdate';

export interface CommsTemplate {
  subject: string;
  inAppTitle: string;
  emailBody: string;
}

export type CommsCatalog = Record<CommsTemplateKey, CommsTemplate>;

/** Comms catalogs per locale — typed subset of the larger locale files. */
export const COMMS: Record<Locale, CommsCatalog> = {
  en: en.comms as CommsCatalog,
  am: am.comms as CommsCatalog,
};

/**
 * Get the translation object for a given locale.
 * Falls back to English if the locale is not found.
 */
export function getTranslations(locale: Locale): typeof en {
  const translations: Record<Locale, typeof en> = { en, am };
  return translations[locale] ?? en;
}

/**
 * Get the comms catalog for a given locale. Falls back to English.
 */
export function getCommsCatalog(locale: Locale): CommsCatalog {
  return COMMS[locale] ?? COMMS.en;
}
