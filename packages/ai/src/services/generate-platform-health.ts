// ============================================================================
// Service: Generate Platform Health Summary
// Model Tier: heavy | Cache TTL: 1h
// ============================================================================

import { callAI } from '../client';
import { getCachedResponse, setCachedResponse, hashPrompt } from '../cache';
import type {
  GeneratePlatformHealthInput,
  GeneratePlatformHealthOutput,
} from '../types';

const CACHE_TTL_SECONDS = 1 * 60 * 60; // 1 hour

const SYSTEM_PROMPT = `You are a platform health analyst for Eventology, an event management platform in Addis Ababa, Ethiopia.
Analyze platform-wide metrics and provide a health assessment.
Evaluate:
- Growth indicators (new users, new events, registrations)
- Content quality (pending moderations, flagged content)
- System reliability (error rates, uptime)
- Revenue health (transaction volumes)
- User engagement (active events, registration rates)

Status levels:
- healthy: All metrics within normal ranges
- attention: Some metrics need monitoring
- critical: Immediate action required

Always respond with valid JSON in this format:
{
  "status": "healthy|attention|critical",
  "summary": "2-3 sentence overall assessment",
  "highlights": [
    { "metric": "Metric Name", "value": "formatted value", "status": "good|warning|critical" }
  ],
  "action_items": ["action item 1", "action item 2"]
}`;

function buildUserPrompt(input: GeneratePlatformHealthInput): string {
  return `Analyze platform health for ${input.period_label}:

Total Events: ${input.total_events}
Active Events: ${input.active_events}
Total Users: ${input.total_users}
New Users (period): ${input.new_users_period}
Total Registrations: ${input.total_registrations}
Revenue (period): ${input.revenue_period} ETB
Pending Moderations: ${input.pending_moderations}
Flagged Content: ${input.flagged_content}
System Errors: ${input.system_errors}`;
}

/**
 * Generates a platform health summary from system-wide metrics.
 * Returns null on failure.
 */
export async function generatePlatformHealthSummary(
  input: GeneratePlatformHealthInput,
): Promise<GeneratePlatformHealthOutput | null> {
  try {
    const cacheKey = `platform-health:${hashPrompt(JSON.stringify(input))}`;
    const cached = await getCachedResponse(cacheKey);
    if (cached) return JSON.parse(cached) as GeneratePlatformHealthOutput;

    const response = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      modelTier: 'heavy',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.content) as GeneratePlatformHealthOutput;

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
      '[AI] generatePlatformHealthSummary failed:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    return null;
  }
}
