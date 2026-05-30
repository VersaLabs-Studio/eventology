import type { TranslateContentInput, TranslateContentOutput } from '../types';
/**
 * Translates content to the target language.
 * Cached for 7 days since translations are deterministic for same input.
 * Returns null on failure.
 */
export declare function translateContent(input: TranslateContentInput): Promise<TranslateContentOutput | null>;
//# sourceMappingURL=translate-content.d.ts.map