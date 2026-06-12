// ============================================================================
// Service: Generate Performance Prediction
// Model Tier: heavy | Cache TTL: 1h
// ============================================================================

import { callAI } from '../client';
import { getCachedResponse, setCachedResponse, hashPrompt } from '../cache';
import type {
  GeneratePerformancePredictionInput,
  GeneratePerformancePredictionOutput,
} from '../types';

const CACHE_TTL_SECONDS = 1 * 60 * 60; // 1 hour

const SYSTEM_PROMPT = `You are a predictive analytics specialist for Eventology.
Based on current event metrics and trends, predict event performance.
Consider:
- Current registration velocity vs time remaining
- Historical patterns for similar event types in Ethiopia
- Featured status impact
- View-to-registration conversion rates
- Capacity constraints

Always respond with valid JSON in this format:
{
  "predicted_attendance": 150,
  "confidence": "low|medium|high",
  "fill_rate_percent": 75.0,
  "risk_level": "low|medium|high",
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

function buildUserPrompt(input: GeneratePerformancePredictionInput): string {
  return `Predict performance for:

Event: ${input.event_title}
Type: ${input.event_type}
Days until event: ${input.days_until_event}
Current registrations: ${input.current_registrations}
Capacity: ${input.capacity}
Views trend (last 7 days): ${input.views_trend.join(', ')}
Registrations trend (last 7 days): ${input.registrations_trend.join(', ')}
Featured: ${input.is_featured ? 'Yes' : 'No'}`;
}

/**
 * Generates performance predictions for an upcoming event.
 * Returns null on failure.
 */
export async function generatePerformancePrediction(
  input: GeneratePerformancePredictionInput,
): Promise<GeneratePerformancePredictionOutput | null> {
  try {
    const cacheKey = `prediction:${hashPrompt(JSON.stringify(input))}`;
    const cached = await getCachedResponse(cacheKey);
    if (cached) return JSON.parse(cached) as GeneratePerformancePredictionOutput;

    const response = await callAI({
      task: 'generate_performance_prediction',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      modelTier: 'heavy',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.content) as GeneratePerformancePredictionOutput;

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
      '[AI] generatePerformancePrediction failed:',
      err instanceof Error ? err.message : 'Unknown error',
    );
    return null;
  }
}
