// ============================================================================
// @eventology/ai — callAI (Public Entry Point)
// ============================================================================
// Public call site for AI completions. After the AI-001 refactor,
// this is a thin delegation to `getAIProvider().complete(opts)`. The
// model chain + provider selection live in `provider.ts` and
// `packages/config/ai.config.ts`; this file just re-exports the
// configured MODEL_CHAIN for downstream consumers that need to know
// the active model in metrics / audit rows.
//
// Adding a service = add a tag in types.ts + a stub fixture in
// stub-fixtures.ts + call callAI({ task: '<your_tag>', ... }).
// ============================================================================

import { AI_MODEL_CHAIN, resolveAIModelChain } from '@eventology/config';
import { getAIProvider } from './provider';
import type { AIRequestOptions, AIResponse } from './types';

/**
 * The configured model chain (env-resolved if AI_MODEL_CHAIN is set,
 * else the documented defaults). Re-exported for downstream callers
 * that need the active chain for metrics/audit.
 */
export { AI_MODEL_CHAIN, resolveAIModelChain };

/**
 * Calls the configured AI provider. Throws on unrecoverable error;
 * the 18 services wrap this in try/catch and return `null` on failure
 * (best-effort). Never throws on the stub.
 */
export async function callAI(options: AIRequestOptions): Promise<AIResponse> {
  return getAIProvider().complete(options);
}
