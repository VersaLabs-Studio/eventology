/**
 * Eventology Mobile — i18n Stub (V1)
 * Minimal English-only stub. The `t()` function returns the key
 * unchanged so screens can already use translation-aware copy
 * without committing to a full i18n setup. V2 will replace this
 * module with a real locale table (likely `expo-localization`
 * + an in-app dictionary).
 */

export const locale = "en-US" as const;

/**
 * Translation stub. Returns the key verbatim.
 * @example
 *   t("common.cancel") // → "common.cancel"
 */
export function t(key: string): string {
  return key;
}
