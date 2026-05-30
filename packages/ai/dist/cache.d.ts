import { type SupabaseClient } from '@supabase/supabase-js';
/**
 * Allows external code to inject a pre-configured Supabase client.
 * Useful for testing or when the web app already has a service client.
 */
export declare function setCacheClient(client: SupabaseClient): void;
/**
 * Creates a SHA-256 hex digest of the input text.
 * Used to generate deterministic cache keys from prompt content.
 */
export declare function hashPrompt(text: string): string;
/**
 * Retrieves a cached AI response by cache key.
 * Returns `null` if not found or expired.
 */
export declare function getCachedResponse(cacheKey: string): Promise<string | null>;
/**
 * Stores an AI response in the cache with a TTL.
 *
 * @param cacheKey    - Unique key for this prompt/response pair
 * @param response    - The AI response content to cache
 * @param modelUsed   - Which model produced this response
 * @param promptHash  - SHA-256 hash of the prompt
 * @param tokensUsed  - Token count from the AI call
 * @param latencyMs   - Latency of the AI call
 * @param ttlSeconds  - How long to cache (in seconds)
 */
export declare function setCachedResponse(cacheKey: string, response: string, modelUsed: string, promptHash: string, tokensUsed: number, latencyMs: number, ttlSeconds: number): Promise<void>;
//# sourceMappingURL=cache.d.ts.map