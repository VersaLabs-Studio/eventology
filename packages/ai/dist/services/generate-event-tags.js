// ============================================================================
// Service: Generate Event Tags
// Model Tier: light | Cache TTL: 24h
// ============================================================================
import { callAI } from '../client';
import { getCachedResponse, setCachedResponse, hashPrompt } from '../cache';
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const SYSTEM_PROMPT = `You are an event tagging specialist for Eventology.
Generate relevant, searchable tags for events.
Tags should be:
- Lowercase, single or two-word phrases
- Relevant to the event content and audience
- Useful for search and filtering
- Between 5-10 tags per event
- Include both specific and general tags

Always respond with valid JSON in this format:
{
  "tags": ["tag1", "tag2", "tag3"]
}`;
function buildUserPrompt(input) {
    return `Generate tags for this event:

Title: ${input.title}
Description: ${input.description}
Event Type: ${input.event_type}
Category: ${input.category}`;
}
/**
 * Generates relevant tags for an event using AI.
 * Returns null on failure.
 */
export async function generateEventTags(input) {
    try {
        const cacheKey = `event-tags:${hashPrompt(JSON.stringify(input))}`;
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
        console.warn('[AI] generateEventTags failed:', err instanceof Error ? err.message : 'Unknown error');
        return null;
    }
}
//# sourceMappingURL=generate-event-tags.js.map