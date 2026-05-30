// ============================================================================
// Service: Generate Marketing Copy
// Model Tier: medium | Cache TTL: 4h
// ============================================================================
import { callAI } from '../client';
import { getCachedResponse, setCachedResponse, hashPrompt } from '../cache';
const CACHE_TTL_SECONDS = 4 * 60 * 60; // 4 hours
const SYSTEM_PROMPT = `You are a marketing copywriter for Eventology, an event management platform in Addis Ababa, Ethiopia.
Create compelling marketing copy that:
- Drives registrations and engagement
- Adapts tone to the platform (email, social, SMS, push)
- Includes clear calls-to-action
- Is culturally appropriate for Ethiopian audiences
- Follows platform-specific best practices (character limits, formatting)

Platform guidelines:
- email: Professional subject line + body, 150-300 words
- social: Catchy, hashtag-friendly, under 280 chars for Twitter
- sms: Ultra-concise, under 160 chars
- push: Brief notification text, under 100 chars

Always respond with valid JSON in this format:
{
  "subject": "Email subject line (email only, null for others)",
  "headline": "Main headline or opening",
  "body": "Marketing body text",
  "cta": "Call to action text"
}`;
function buildUserPrompt(input) {
    return `Create marketing copy for:

Event: ${input.event_title}
Description: ${input.event_description}
Type: ${input.event_type}
Target Audience: ${input.target_audience}
Platform: ${input.platform}
Tone: ${input.tone ?? 'exciting'}`;
}
/**
 * Generates platform-specific marketing copy for an event.
 * Returns null on failure.
 */
export async function generateMarketingCopy(input) {
    try {
        const cacheKey = `marketing:${hashPrompt(JSON.stringify(input))}`;
        const cached = await getCachedResponse(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const response = await callAI({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: buildUserPrompt(input) },
            ],
            modelTier: 'medium',
            response_format: { type: 'json_object' },
        });
        const result = JSON.parse(response.content);
        await setCachedResponse(cacheKey, response.content, response.model_used, hashPrompt(JSON.stringify(input)), response.tokens_used, response.latency_ms, CACHE_TTL_SECONDS);
        return result;
    }
    catch (err) {
        console.warn('[AI] generateMarketingCopy failed:', err instanceof Error ? err.message : 'Unknown error');
        return null;
    }
}
//# sourceMappingURL=generate-marketing-copy.js.map