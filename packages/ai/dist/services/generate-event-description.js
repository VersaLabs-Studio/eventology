// ============================================================================
// Service: Generate Event Description
// Model Tier: medium | Cache TTL: 24h
// ============================================================================
import { callAI } from '../client';
import { getCachedResponse, setCachedResponse, hashPrompt } from '../cache';
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const SYSTEM_PROMPT = `You are an expert event copywriter for Eventology, an event management platform in Addis Ababa, Ethiopia.
Your job is to write compelling, professional event descriptions that:
- Highlight the unique value proposition of the event
- Include relevant details (date, venue, what attendees will learn/experience)
- Use engaging, accessible language appropriate for the target audience
- Are SEO-friendly with natural keyword inclusion
- Are culturally appropriate for an Ethiopian audience

Always respond with valid JSON in this format:
{
  "description": "Full event description (2-4 paragraphs)",
  "short_description": "Concise 1-2 sentence summary for cards and previews"
}`;
function buildUserPrompt(input) {
    return `Write an event description for:

Title: ${input.title}
Event Type: ${input.event_type}
Category: ${input.category}
${input.venue_name ? `Venue: ${input.venue_name}` : 'Online Event'}
Date: ${input.start_date}
${input.tags?.length ? `Tags: ${input.tags.join(', ')}` : ''}
${input.short_description ? `Existing short description to improve: ${input.short_description}` : ''}`;
}
/**
 * Generates a compelling event description and short summary using AI.
 * Returns null on failure (graceful degradation).
 */
export async function generateEventDescription(input) {
    try {
        const cacheKey = `event-desc:${hashPrompt(JSON.stringify(input))}`;
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
        console.warn('[AI] generateEventDescription failed:', err instanceof Error ? err.message : 'Unknown error');
        return null;
    }
}
//# sourceMappingURL=generate-event-description.js.map