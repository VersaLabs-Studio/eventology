// ============================================================================
// @eventology/locales — Barrel Export
// ============================================================================
import en from './en.json';
import am from './am.json';
export { en, am };
/** Supported locale codes */
export const LOCALES = ['en', 'am'];
/** Default locale */
export const DEFAULT_LOCALE = 'en';
/** Locale display names */
export const LOCALE_NAMES = {
    en: 'English',
    am: 'አማርኛ',
};
/**
 * Get the translation object for a given locale.
 * Falls back to English if the locale is not found.
 */
export function getTranslations(locale) {
    const translations = { en, am };
    return translations[locale] ?? en;
}
//# sourceMappingURL=index.js.map