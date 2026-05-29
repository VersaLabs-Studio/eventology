// ============================================================================
// Service: Generate Event Recap
// Model Tier: medium | Cache TTL: 24h
// ============================================================================

import { callAI } from '../client';
import { getCachedResponse, setCachedResponse, hashPrompt } from '../cache';
import type {
  GenerateEventRecapInput,
  GenerateEventRecapOutput,
} from '../types';

const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

const SYSTEM_PROMPT = `You are a post-event storyteller for Eventology, an event management platform in Addis Ababa, Ethiopia.
Create engaging event recap content that:
- Celebrates the event's success
- Highlights key moments and achievements
- Thanks attendees, speakers, and sponsors
- Builds excitement for future events
- Is shareable on social media

Tone: Celebratory, professional, community-focused.
Consider Ethiopian cultural values of community and togetherness.

Always respond with valid JSON in this format:
{
  "recap_title": "Engaging recap headline",
  "recap_body": "2-4 paragraph event recap story",
  "key_stats": [
    { "label": "Attendees", "value": "150" },
    { "label": "Satisfaction", "value": "4.8/5" }
  ],
  "highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "thank_you_message": "Heartfelt thank you to attendees and team"
}`;

function buildUserPrompt(input: GenerateEventRecapInput): string {
  return `Write a recap for:

Event: ${input.event_title}
Type: ${input.event_type}
Description: ${input.description}
Date: ${input.start_date} to ${input.end_date}
${input.venue_name ? `Venue: ${input.venue_name}` : 'Online Event'}
Registrations: ${input.total_registrations}
Checked In: ${input.checked_in_count}
Capacity: ${input.capacity}
${input.revenue !== undefined ? `Revenue: ${input.revenue} ETB` : ''}
${input.highlights?.length ? `Event highlights: ${input.highlights.join('; ')}` : ''}
${input.feedback_summary ? `Feedback summary: ${input.feedback_summary}` : ''}`;
}

/**
 * Generates a post-event recap with highlights and thank-you content.
 * Returns null on failure.
 */
export async function generateEventRecap(
  input: GenerateEventRecapInput,
): Promise<GenerateEventRecapOutput | null> {
  try {
    const cacheKey = `event-recap:${hashPrompt(JSON.stringify(input))}`;
    const cached = await getCachedResponse(cacheKey);
    if (cached) return JSON.parse(cached) as GenerateEventRecapOutput;

    const response = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      modelTier: 'medium',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.content) as GenerateEventRecapOutput;

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
      '[AI] generateEventRecap failed:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    return null;
  }
}
