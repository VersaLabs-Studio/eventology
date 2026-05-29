// ============================================================================
// Service: Generate Analytics Narrative
// Model Tier: heavy | Cache TTL: 1h
// ============================================================================

import { callAI } from '../client';
import { getCachedResponse, setCachedResponse, hashPrompt } from '../cache';
import type {
  GenerateAnalyticsNarrativeInput,
  GenerateAnalyticsNarrativeOutput,
} from '../types';

const CACHE_TTL_SECONDS = 1 * 60 * 60; // 1 hour

const SYSTEM_PROMPT = `You are an analytics interpreter for Eventology.
Translate raw event metrics into clear, actionable narratives.
Your job is to:
- Explain what the numbers mean in plain language
- Identify trends and patterns
- Provide context (is this good? bad? improving?)
- Suggest specific, actionable improvements
- Use Ethiopian market context when relevant

Always respond with valid JSON in this format:
{
  "narrative": "2-3 paragraph narrative explaining the analytics",
  "key_metrics": [
    { "label": "Metric Name", "value": "formatted value", "trend": "up|down|stable" }
  ],
  "recommendations": ["actionable recommendation 1", "recommendation 2"]
}`;

function buildUserPrompt(input: GenerateAnalyticsNarrativeInput): string {
  return `Analyze these event metrics for ${input.period_label}:

Event: ${input.event_title}
Registrations: ${input.registrations_count}
Capacity: ${input.capacity}
Views: ${input.views_count}
${input.revenue !== undefined ? `Revenue: ${input.revenue} ETB` : ''}
${input.previous_registrations !== undefined ? `Previous period registrations: ${input.previous_registrations}` : ''}
${input.previous_views !== undefined ? `Previous period views: ${input.previous_views}` : ''}`;
}

/**
 * Generates a natural language narrative from event analytics data.
 * Returns null on failure.
 */
export async function generateAnalyticsNarrative(
  input: GenerateAnalyticsNarrativeInput,
): Promise<GenerateAnalyticsNarrativeOutput | null> {
  try {
    const cacheKey = `analytics:${hashPrompt(JSON.stringify(input))}`;
    const cached = await getCachedResponse(cacheKey);
    if (cached) return JSON.parse(cached) as GenerateAnalyticsNarrativeOutput;

    const response = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      modelTier: 'heavy',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.content) as GenerateAnalyticsNarrativeOutput;

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
      '[AI] generateAnalyticsNarrative failed:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    return null;
  }
}
