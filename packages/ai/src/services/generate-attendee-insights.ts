// ============================================================================
// Service: Generate Attendee Insights
// Model Tier: heavy | Cache TTL: 1h
// ============================================================================

import { callAI } from '../client';
import { getCachedResponse, setCachedResponse, hashPrompt } from '../cache';
import type {
  GenerateAttendeeInsightsInput,
  GenerateAttendeeInsightsOutput,
} from '../types';

const CACHE_TTL_SECONDS = 1 * 60 * 60; // 1 hour

const SYSTEM_PROMPT = `You are an attendee behavior analyst for Eventology.
Analyze registration and attendance data to provide actionable insights.
Focus on:
- Registration patterns and timing
- Attendance rates and what affects them
- Tier popularity and pricing optimization
- Geographic distribution insights
- Recommendations to improve attendance

Always respond with valid JSON in this format:
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "attendance_rate": 75.5,
  "peak_registration_period": "3-5 days before event",
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

function buildUserPrompt(input: GenerateAttendeeInsightsInput): string {
  return `Analyze attendee data for "${input.event_title}":

Total Registrations: ${input.total_registrations}
Checked In: ${input.checked_in_count}
Cancelled: ${input.cancelled_count}
Ticket Tiers: ${input.ticket_tiers.map((t) => `${t.name}: ${t.sold}/${t.capacity}`).join(', ')}
Registration dates: ${input.registration_dates.length} entries
${input.top_sub_cities?.length ? `Top locations: ${input.top_sub_cities.join(', ')}` : ''}`;
}

/**
 * Generates attendee behavior insights from registration data.
 * Returns null on failure.
 */
export async function generateAttendeeInsights(
  input: GenerateAttendeeInsightsInput,
): Promise<GenerateAttendeeInsightsOutput | null> {
  try {
    const cacheKey = `attendee-insights:${hashPrompt(JSON.stringify(input))}`;
    const cached = await getCachedResponse(cacheKey);
    if (cached) return JSON.parse(cached) as GenerateAttendeeInsightsOutput;

    const response = await callAI({
      task: 'generate_attendee_insights',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      modelTier: 'heavy',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.content) as GenerateAttendeeInsightsOutput;

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
      '[AI] generateAttendeeInsights failed:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    return null;
  }
}
