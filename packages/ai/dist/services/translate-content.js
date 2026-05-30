// ============================================================================
// Service: Translate Content
// Model Tier: light | Cache TTL: 7 days
// ============================================================================
import { callAI } from '../client';
import { getCachedResponse, setCachedResponse, hashPrompt } from '../cache';
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const SYSTEM_PROMPT = `You are a professional translator for Eventology, an event management platform in Ethiopia.
Translate content accurately while:
- Preserving meaning, tone, and intent
- Using appropriate formal/informal register for the content type
- Handling event-specific terminology correctly
- Maintaining formatting and structure
- Supporting Ethiopian languages (Amharic, Oromo, Tigrinya) and international languages

For event content, keep proper nouns (event names, venue names) in their original form.

Always respond with valid JSON in this format:
{
  "translated_text": "The translated content",
  "source_language": "detected or specified source language code",
  "target_language": "target language code",
  "confidence": 0.95
}`;
function buildUserPrompt(input) {
    return `Translate this ${input.content_type ?? 'general'} content to ${input.target_language}:

"${input.text}"
${input.source_language ? `Source language: ${input.source_language}` : 'Auto-detect the source language.'}`;
}
/**
 * Translates content to the target language.
 * Cached for 7 days since translations are deterministic for same input.
 * Returns null on failure.
 */
export async function translateContent(input) {
    try {
        const cacheKey = `translate:${input.target_language}:${hashPrompt(JSON.stringify(input))}`;
        const cached = await getCachedResponse(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const response = await callAI({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: buildUserPrompt(input) },
            ],
            modelTier: 'light',
            response_format: { type: 'json_object' },
        });
        const result = JSON.parse(response.content);
        await setCachedResponse(cacheKey, response.content, response.model_used, hashPrompt(JSON.stringify(input)), response.tokens_used, response.latency_ms, CACHE_TTL_SECONDS);
        return result;
    }
    catch (err) {
        console.warn('[AI] translateContent failed:', err instanceof Error ? err.message : 'Unknown error');
        return null;
    }
}
//# sourceMappingURL=translate-content.js.map