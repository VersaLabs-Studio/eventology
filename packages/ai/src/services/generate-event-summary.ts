// ============================================================================
// Service: Generate Event Summary
// Model Tier: light | Cache TTL: 24h
// ============================================================================

import { callAI } from '../client';
import { getCachedResponse, setCachedResponse, hashPrompt } from '../cache';
import type {
  GenerateEventSummaryInput,
  GenerateEventSummaryOutput,
} from '../types';

const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

const SYSTEM_PROMPT = `You are a concise event summarizer for Eventology.
Create brief, informative summaries that capture the essence of an event.
Focus on what makes the event valuable to attendees.

Always respond with valid JSON in this format:
{
  "summary": "2-3 sentence event summary",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"]
}`;

function buildUserPrompt(input: GenerateEventSummaryInput): string {
  return `Summarize this event:

Title: ${input.title}
Type: ${input.event_type}
Description: ${input.description}
Date: ${input.start_date} to ${input.end_date}
${input.venue_name ? `Venue: ${input.venue_name}` : 'Online'}
Registrations: ${input.registrations_count} / ${input.capacity} capacity`;
}

/**
 * Generates a concise event summary with key highlights.
 * Returns null on failure.
 */
export async function generateEventSummary(
  input: GenerateEventSummaryInput,
): Promise<GenerateEventSummaryOutput | null> {
  try {
    const cacheKey = `event-summary:${hashPrompt(JSON.stringify(input))}`;
    const cached = await getCachedResponse(cacheKey);
    if (cached) return JSON.parse(cached) as GenerateEventSummaryOutput;

    const response = await callAI({
      task: 'generate_event_summary',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      modelTier: 'light',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.content) as GenerateEventSummaryOutput;

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
      '[AI] generateEventSummary failed:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    return null;
  }
}
