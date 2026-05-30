// ============================================================================
// @eventology/ai — AI Cache
// ============================================================================
// Caches AI/LLM responses in the Supabase `ai_cache` table.
// Uses service-role client to bypass RLS (table is service-role only).
// ============================================================================
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
// ---------------------------------------------------------------------------
// Singleton Supabase service-role client
// ---------------------------------------------------------------------------
let _supabase = null;
/**
 * Returns (or lazily initializes) a Supabase service-role client
 * for AI cache operations. Requires SUPABASE_SERVICE_ROLE_KEY env var.
 */
function getSupabase() {
    if (_supabase)
        return _supabase;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('[AI Cache] NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    }
    _supabase = createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
    return _supabase;
}
/**
 * Allows external code to inject a pre-configured Supabase client.
 * Useful for testing or when the web app already has a service client.
 */
export function setCacheClient(client) {
    _supabase = client;
}
// ---------------------------------------------------------------------------
// hashPrompt — Deterministic hash for cache keys
// ---------------------------------------------------------------------------
/**
 * Creates a SHA-256 hex digest of the input text.
 * Used to generate deterministic cache keys from prompt content.
 */
export function hashPrompt(text) {
    return createHash('sha256').update(text).digest('hex');
}
// ---------------------------------------------------------------------------
// getCachedResponse — Read from cache
// ---------------------------------------------------------------------------
/**
 * Retrieves a cached AI response by cache key.
 * Returns `null` if not found or expired.
 */
export async function getCachedResponse(cacheKey) {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('ai_cache')
            .select('response')
            .eq('cache_key', cacheKey)
            .gt('expires_at', new Date().toISOString())
            .single();
        if (error || !data) {
            return null;
        }
        return data.response;
    }
    catch {
        // Graceful degradation — cache miss is non-fatal
        return null;
    }
}
// ---------------------------------------------------------------------------
// setCachedResponse — Write to cache
// ---------------------------------------------------------------------------
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
export async function setCachedResponse(cacheKey, response, modelUsed, promptHash, tokensUsed, latencyMs, ttlSeconds) {
    try {
        const supabase = getSupabase();
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
        const { error } = await supabase.from('ai_cache').upsert({
            cache_key: cacheKey,
            response,
            model_used: modelUsed,
            prompt_hash: promptHash,
            tokens_used: tokensUsed,
            latency_ms: latencyMs,
            expires_at: expiresAt,
        }, {
            onConflict: 'cache_key',
        });
        if (error) {
            // Log but don't throw — cache write failure is non-fatal
            console.warn('[AI Cache] Failed to write cache entry:', error.message);
        }
    }
    catch (err) {
        // Graceful degradation — cache write failure should never crash the app
        console.warn('[AI Cache] Cache write error:', err instanceof Error ? err.message : 'Unknown error');
    }
}
//# sourceMappingURL=cache.js.map