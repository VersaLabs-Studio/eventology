import type { AIRequestOptions, AIResponse } from './types';
/**
 * Ordered fallback chain of OpenRouter free-tier models.
 * - heavy   (0-1): Content moderation, fraud detection, analytics narration
 * - medium  (2-4): Description generation, marketing copy, recommendations
 * - light   (5-7): Auto-tagging, translation, simple chatbot
 */
export declare const MODEL_CHAIN: readonly ["nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", "openai/gpt-oss-120b:free", "poolside/laguna-xs.2:free", "poolside/laguna-m.1:free", "arcee-ai/trinity-large-thinking:free", "nvidia/nemotron-3-nano-30b-a3b:free", "nvidia/nemotron-nano-9b-v2:free", "openai/gpt-oss-20b:free"];
/**
 * Calls OpenRouter with automatic fallback through the model chain.
 *
 * Starts at the tier-appropriate model and falls back to cheaper models
 * on failure. Throws only if ALL models in the chain are exhausted.
 *
 * @returns Structured AIResponse with content, model info, and metrics.
 */
export declare function callAI(options: AIRequestOptions): Promise<AIResponse>;
//# sourceMappingURL=client.d.ts.map