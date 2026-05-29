// ============================================================================
// @eventology/ai — OpenRouter Client
// ============================================================================
// 8-model fallback chain using native `fetch` to OpenRouter API.
// No external AI SDK — pure HTTP calls (as required by spec).
// ============================================================================

import type { AIRequestOptions, AIResponse, ModelTier } from './types';

// ---------------------------------------------------------------------------
// Model Chain — 8 free-tier models with tier-based routing
// ---------------------------------------------------------------------------

/**
 * Ordered fallback chain of OpenRouter free-tier models.
 * - heavy   (0-1): Content moderation, fraud detection, analytics narration
 * - medium  (2-4): Description generation, marketing copy, recommendations
 * - light   (5-7): Auto-tagging, translation, simple chatbot
 */
export const MODEL_CHAIN = [
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'openai/gpt-oss-120b:free',
  'poolside/laguna-xs.2:free',
  'poolside/laguna-m.1:free',
  'arcee-ai/trinity-large-thinking:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'openai/gpt-oss-20b:free',
] as const;

/** Starting index for each model tier in the MODEL_CHAIN. */
const TIER_START_INDEX: Record<ModelTier, number> = {
  heavy: 0,
  medium: 2,
  light: 5,
} as const;

/** Default timeout per model attempt (30 seconds). */
const DEFAULT_TIMEOUT_MS = 30_000;

/** OpenRouter API endpoint. */
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ---------------------------------------------------------------------------
// callAI — Main entry point
// ---------------------------------------------------------------------------

/**
 * Calls OpenRouter with automatic fallback through the model chain.
 *
 * Starts at the tier-appropriate model and falls back to cheaper models
 * on failure. Throws only if ALL models in the chain are exhausted.
 *
 * @returns Structured AIResponse with content, model info, and metrics.
 */
export async function callAI(options: AIRequestOptions): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      '[AI] OPENROUTER_API_KEY is not set. Add it to your environment variables.',
    );
  }

  const startIndex = TIER_START_INDEX[options.modelTier];
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const errors: string[] = [];

  // Try each model from the tier's start index to the end of the chain
  for (let i = startIndex; i < MODEL_CHAIN.length; i++) {
    const model = MODEL_CHAIN[i];
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const body: Record<string, unknown> = {
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
      };

      if (options.max_tokens) {
        body.max_tokens = options.max_tokens;
      }

      if (options.response_format) {
        body.response_format = options.response_format;
      }

      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://eventology.app',
          'X-Title': 'Eventology AI',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        errors.push(`[${model}] HTTP ${response.status}: ${errorText}`);

        // Rate limited or server error — try next model
        if (response.status === 429 || response.status >= 500) {
          continue;
        }

        // Client errors (400, 401, 403) — skip to next model
        continue;
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { total_tokens?: number };
        model?: string;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        errors.push(`[${model}] Empty response content`);
        continue;
      }

      return {
        content,
        model_used: data.model ?? model,
        tokens_used: data.usage?.total_tokens ?? 0,
        latency_ms: latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      if (error instanceof DOMException && error.name === 'AbortError') {
        errors.push(`[${model}] Timeout after ${timeoutMs}ms`);
      } else {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(`[${model}] ${message}`);
      }

      // If we got a partial response before timeout, note it
      if (latencyMs > timeoutMs * 0.9) {
        // Likely a timeout — move to next model
        continue;
      }

      // Network error — try next model
      continue;
    }
  }

  // All models exhausted
  throw new Error(
    `[AI] All models in the ${options.modelTier} tier chain exhausted.\n` +
      `Attempted models: ${MODEL_CHAIN.slice(startIndex).join(', ')}\n` +
      `Errors:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
  );
}
