// ============================================================================
// Service: Recommend Events
// Model Tier: medium | Cache TTL: 1h
// ============================================================================

import { callAI } from '../client';
import { getCachedResponse, setCachedResponse, hashPrompt } from '../cache';
import type {
  RecommendEventsInput,
  RecommendEventsOutput,
} from '../types';

const CACHE_TTL_SECONDS = 1 * 60 * 60; // 1 hour

const SYSTEM_PROMPT = `You are an event recommendation engine for Eventology, an event management platform in Addis Ababa, Ethiopia.
Match users with events they'll love based on:
- Past attendance and ratings
- Stated preferences (categories, event types, location)
- Price range compatibility
- Event timing and availability

Scoring:
- match_score: 0.0 to 1.0 (1.0 = perfect match)
- reason: Brief explanation of why this event matches

Prioritize diversity in recommendations — don't recommend only one type.
Consider Ethiopian cultural events, holidays, and local preferences.

Always respond with valid JSON in this format:
{
  "recommendations": [
    {
      "event_id": "uuid",
      "title": "Event Title",
      "match_score": 0.85,
      "reason": "Why this event matches the user"
    }
  ]
}`;

function buildUserPrompt(input: RecommendEventsInput): string {
  return `Recommend events for user ${input.user_id}:

${input.user_preferences ? `Preferences: ${JSON.stringify(input.user_preferences)}` : 'No stated preferences'}
${input.past_attendance?.length ? `Past events: ${JSON.stringify(input.past_attendance)}` : 'No attendance history'}

Available events (${input.available_events.length}):
${input.available_events
  .map(
    (e) =>
      `- [${e.id}] ${e.title} | ${e.category} | ${e.event_type} | ${e.start_date}${e.price !== undefined ? ` | ${e.price} ETB` : ''}`,
  )
  .join('\n')}

Return up to ${input.limit ?? 5} recommendations.`;
}

/**
 * Generates personalized event recommendations for a user.
 * Returns null on failure.
 */
export async function recommendEvents(
  input: RecommendEventsInput,
): Promise<RecommendEventsOutput | null> {
  try {
    const cacheKey = `recommend:${input.user_id}:${hashPrompt(JSON.stringify(input.available_events.map((e) => e.id)))}`;
    const cached = await getCachedResponse(cacheKey);
    if (cached) return JSON.parse(cached) as RecommendEventsOutput;

    const response = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      modelTier: 'medium',
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const result = JSON.parse(response.content) as RecommendEventsOutput;

    await setCachedResponse(
      cacheKey,
      response.content,
      response.model_used,
      hashPrompt(JSON.stringify(input)),
      response.tokens_used,
      response.latency_ms,
      CACHE_TTL_SECONDS,
    );

    return result;
  } catch (err) {
    console.warn(
      '[AI] recommendEvents failed:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    return null;
  }
}
