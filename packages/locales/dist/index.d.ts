import en from './en.json';
import am from './am.json';
export { en, am };
/** Supported locale codes */
export declare const LOCALES: readonly ["en", "am"];
export type Locale = (typeof LOCALES)[number];
/** Default locale */
export declare const DEFAULT_LOCALE: Locale;
/** Locale display names */
export declare const LOCALE_NAMES: Record<Locale, string>;
/**
 * Get the translation object for a given locale.
 * Falls back to English if the locale is not found.
 */
export declare function getTranslations(locale: Locale): typeof en;
//# sourceMappingURL=index.d.ts.map