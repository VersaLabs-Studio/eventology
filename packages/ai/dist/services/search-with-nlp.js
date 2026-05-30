// ============================================================================
// Service: Search with NLP
// Model Tier: light | Cache TTL: none (search queries are unique)
// ============================================================================
import { callAI } from '../client';
const SYSTEM_PROMPT = `You are a natural language search interpreter for Eventology, an event management platform in Addis Ababa, Ethiopia.
Parse natural language search queries into structured filters.

Understand queries like:
- "tech conferences next month" → event_type: conference, category: technology, date: next month
- "free workshops near me in Bole" → ticket_type: free, event_type: workshop, location: Bole
- "music events this weekend under 500 ETB" → category: music, date: this weekend, price: <500
- "networking events for developers" → event_type: networking, tags: developers

Date interpretation:
- "this weekend" = upcoming Saturday-Sunday
- "next week" = next Mon-Sun
- "this month" = current month
- "next month" = following month

Location context: Default to Addis Ababa sub-cities (Bole, Kirkos, Arada, Yeka, etc.)

Always respond with valid JSON in this format:
{
  "interpreted_query": "Clear restatement of what the user is looking for",
  "filters": {
    "categories": ["category1"],
    "event_types": ["type1"],
    "locations": ["location1"],
    "date_range": { "start": "ISO date", "end": "ISO date" },
    "price_range": { "min": 0, "max": 500 },
    "tags": ["tag1"]
  },
  "keywords": ["keyword1", "keyword2"],
  "intent": "search|browse|specific_event|recommendation"
}`;
function buildUserPrompt(input) {
    return `Parse this search query: "${input.query}"

${input.available_categories?.length ? `Available categories: ${input.available_categories.join(', ')}` : ''}
${input.available_event_types?.length ? `Available event types: ${input.available_event_types.join(', ')}` : ''}
${input.available_locations?.length ? `Available locations: ${input.available_locations.join(', ')}` : ''}`;
}
/**
 * Interprets a natural language search query into structured filters.
 * NEVER cached — search queries are unique and context-dependent.
 * Returns null on failure.
 */
export async function searchWithNLP(input) {
    try {
        const response = await callAI({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: buildUserPrompt(input) },
            ],
            modelTier: 'light',
            response_format: { type: 'json_object' },
        });
        return JSON.parse(response.content);
    }
    catch (err) {
        console.warn('[AI] searchWithNLP failed:', err instanceof Error ? err.message : 'Unknown error');
        return null;
    }
}
//# sourceMappingURL=search-with-nlp.js.map