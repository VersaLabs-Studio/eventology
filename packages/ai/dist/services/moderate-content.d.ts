import type { ModerateContentInput, ModerateContentOutput } from '../types';
/**
 * Moderates content for safety and policy compliance.
 * NEVER cached — moderation must always run fresh.
 * Returns null on failure (default to safe to avoid blocking legitimate content).
 */
export declare function moderateContent(input: ModerateContentInput): Promise<ModerateContentOutput | null>;
//# sourceMappingURL=moderate-content.d.ts.map