// ============================================================================
// Service: Generate Pricing Suggestion
// Model Tier: heavy | Cache TTL: 1h
// ============================================================================

import { callAI } from '../client';
import { getCachedResponse, setCachedResponse, hashPrompt } from '../cache';
import type {
  GeneratePricingSuggestionInput,
  GeneratePricingSuggestionOutput,
} from '../types';

const CACHE_TTL_SECONDS = 1 * 60 * 60; // 1 hour

const SYSTEM_PROMPT = `You are a pricing strategist for Eventology, an event management platform in Addis Ababa, Ethiopia.
Suggest realistic ticket pricing in Ethiopian Birr (ETB) based on:
- Event type and category
- Venue capacity and overhead
- Target audience purchasing power
- Market positioning (premium vs accessible)
- Comparable events in the Ethiopian market

Consider that the average monthly salary in Addis Ababa is around 8,000-15,000 ETB.
Free events should also be suggested when appropriate.

Always respond with valid JSON in this format:
{
  "tiers": [
    {
      "name": "Early Bird / General / VIP",
      "suggested_price": 500,
      "currency": "ETB",
      "rationale": "Why this price point"
    }
  ],
  "general_advice": "Overall pricing strategy advice",
  "confidence": "low|medium|high"
}`;

function buildUserPrompt(input: GeneratePricingSuggestionInput): string {
  return `Suggest pricing for:

Event Type: ${input.event_type}
Category: ${input.category}
Venue Capacity: ${input.venue_capacity}
Target Audience: ${input.target_audience}
${input.comparable_event_prices?.length ? `Comparable prices: ${input.comparable_event_prices.join(', ')} ETB` : 'No comparable data'}
Organizer Tier: ${input.organizer_tier ?? 'new'}`;
}

/**
 * Generates AI-powered pricing suggestions for event ticket tiers.
 * Returns null on failure.
 */
export async function generatePricingSuggestion(
  input: GeneratePricingSuggestionInput,
): Promise<GeneratePricingSuggestionOutput | null> {
  try {
    const cacheKey = `pricing:${hashPrompt(JSON.stringify(input))}`;
    const cached = await getCachedResponse(cacheKey);
    if (cached) return JSON.parse(cached) as GeneratePricingSuggestionOutput;

    const response = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      modelTier: 'heavy',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.content) as GeneratePricingSuggestionOutput;

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
      '[AI] generatePricingSuggestion failed:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    return null;
  }
}
