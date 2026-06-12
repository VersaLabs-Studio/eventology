// ============================================================================
// @eventology/config — AI Configuration
// ============================================================================
// Config-driven model chain + tier boundaries. The 8-model chain lives here
// (NOT in packages/ai/src/client.ts) so live cutover is a config swap, not a
// code edit. The placeholder IDs are kept as documented defaults — replace
// with Kidus-supplied OpenRouter model IDs when ready.
//
// Env overrides (set on the platform, NOT hardcoded downstream):
//   AI_MODEL_CHAIN  — comma-separated list of OpenRouter model IDs (8 entries)
//   AI_TIER_HEAVY_START  — index where the 'heavy' tier begins (default 0)
//   AI_TIER_MEDIUM_START — index where the 'medium' tier begins (default 2)
//   AI_TIER_LIGHT_START  — index where the 'light' tier begins (default 5)
//
// LIVE CUTOVER (per docs/HANDOFF_PHASE3_DAY14_AI.md):
//   1. Set OPENROUTER_API_KEY in env.
//   2. Replace the placeholder IDs in AI_MODEL_CHAIN below (or set
//      AI_MODEL_CHAIN env var) with Kidus-supplied OpenRouter model IDs.
//   3. Set AI_PROVIDER=openrouter.
//   4. Confirm getAIProvider() resolves to OpenRouterProvider.
//   5. Smoke-test one service per tier.
// No application-code change should be required for any of the above.
// ============================================================================

/**
 * Ordered fallback chain of OpenRouter free-tier models.
 *
 *   heavy   (0..1):  Content moderation, fraud detection, analytics narration
 *   medium  (2..4):  Description generation, marketing copy, recommendations
 *   light   (5..7):  Auto-tagging, translation, simple chatbot
 *
 * TODO: replace placeholder IDs with Kidus-supplied OpenRouter model IDs.
 * The 8 IDs are placeholders that intentionally point at the original
 * free-tier chain documented in the prior `client.ts` so the seam can be
 * exercised in `openrouter` mode WITHOUT raising a 404 from the actual
 * model slug — but cutover is still a config-only swap.
 */
export const AI_MODEL_CHAIN: readonly string[] = [
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', // TODO replace — heavy 0
  'openai/gpt-oss-120b:free',                            // TODO replace — heavy 1
  'poolside/laguna-xs.2:free',                            // TODO replace — medium 2
  'poolside/laguna-m.1:free',                             // TODO replace — medium 3
  'arcee-ai/trinity-large-thinking:free',                 // TODO replace — medium 4
  'nvidia/nemotron-3-nano-30b-a3b:free',                  // TODO replace — light 5
  'nvidia/nemotron-nano-9b-v2:free',                      // TODO replace — light 6
  'openai/gpt-oss-20b:free',                              // TODO replace — light 7
] as const;

/** Default tier boundaries (indices into AI_MODEL_CHAIN). */
export const AI_TIER_START: Record<'heavy' | 'medium' | 'light', number> = {
  heavy: 0,
  medium: 2,
  light: 5,
} as const;

/**
 * Resolves the model chain from `process.env.AI_MODEL_CHAIN` (comma-
 * separated) when set, otherwise the documented defaults. Strips
 * whitespace and rejects empty entries. Throws if the resolved chain
 * is empty or shorter than the lowest tier start.
 */
export function resolveAIModelChain(): readonly string[] {
  const raw = process.env.AI_MODEL_CHAIN;
  if (!raw || raw.trim().length === 0) {
    return AI_MODEL_CHAIN;
  }
  const parsed = raw
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m.length > 0);
  if (parsed.length === 0) {
    return AI_MODEL_CHAIN;
  }
  // Must cover at least the light tier start (heaviest light-tier index).
  if (parsed.length < AI_TIER_START.light + 1) {
    throw new Error(
      '[AI Config] AI_MODEL_CHAIN must contain at least ' +
        `${AI_TIER_START.light + 1} entries to cover the 'light' tier. ` +
        `Got ${parsed.length}.`
    );
  }
  return parsed;
}

/**
 * Resolves the tier start indices from env (one per tier) when set, else
 * the defaults. Validates the indices against the resolved chain length
 * — heavy must be < medium < light < chain length.
 */
export function resolveAITierStart(
  chain: readonly string[]
): Record<'heavy' | 'medium' | 'light', number> {
  const readIndex = (envKey: string, fallback: number): number => {
    const raw = process.env[envKey];
    if (!raw) return fallback;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0 || n >= chain.length) {
      throw new Error(
        `[AI Config] ${envKey} must be an integer in [0, ${chain.length - 1}]. ` +
          `Got "${raw}".`
      );
    }
    return n;
  };

  const heavy = readIndex('AI_TIER_HEAVY_START', AI_TIER_START.heavy);
  const medium = readIndex('AI_TIER_MEDIUM_START', AI_TIER_START.medium);
  const light = readIndex('AI_TIER_LIGHT_START', AI_TIER_START.light);

  if (!(heavy < medium && medium < light)) {
    throw new Error(
      '[AI Config] AI_TIER_*_START must be strictly increasing and ' +
        `in [0, ${chain.length - 1}]. Got heavy=${heavy}, medium=${medium}, ` +
        `light=${light}.`
    );
  }
  return { heavy, medium, light };
}
