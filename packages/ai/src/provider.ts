// ============================================================================
// @eventology/ai — AI Provider Seam
// ============================================================================
// Introduces a pluggable provider boundary at the callAI level, mirroring
// the comms/payments factory pattern (P2). The 18 services keep working
// unchanged; the only difference is that callAI now delegates to
// `getAIProvider().complete(opts)`.
//
// Two providers ship:
//   - StubAIProvider  — default. Deterministic, valid-JSON responses
//                       from `stub-fixtures.ts`. No network, no key.
//   - OpenRouterProvider — wraps the prior 8-model chain + tier routing,
//                           but now reads the model chain + tier starts
//                           from `packages/config/ai.config.ts` instead
//                           of a hardcoded constant.
//
// Selection is keyed off `process.env.AI_PROVIDER` (default 'stub').
// If AI_PROVIDER=openrouter but the key or model chain is missing, the
// factory throws a LOUD config error at first call. No silent fallback
// to stub — misconfig must be obvious.
// ============================================================================

import { resolveAIModelChain, resolveAITierStart } from '@eventology/config';
import type { AIRequestOptions, AIResponse, AIMessage } from './types';
import { getStubResponse } from './stub-fixtures';

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

/**
 * The contract every AI provider must implement. The seam is intentionally
 * narrow — providers only have to handle the chat-completion request and
 * return a string content + minimal metadata. Caching, retries, JSON
 * parsing, and `return null on failure` are handled by the services that
 * use this seam (they own the "AI is best-effort" contract).
 */
export interface AIProvider {
  /** Provider name (for logging + delivery-row audit). */
  readonly name: string;

  /**
   * Sends a chat-completion request. Returns an AIResponse with at
   * minimum a non-empty `content` string. Throws on unrecoverable error.
   * Services wrap the call in try/catch and degrade to null.
   */
  complete(options: AIRequestOptions): Promise<AIResponse>;
}

// ---------------------------------------------------------------------------
// Stub provider
// ---------------------------------------------------------------------------

/**
 * Default provider. Returns deterministic, type-correct JSON for the
 * task. No network, no key, no timing. Caching (if any) is handled by
 * the services that call this provider.
 */
export class StubAIProvider implements AIProvider {
  readonly name = 'stub';

  async complete(options: AIRequestOptions): Promise<AIResponse> {
    const output = getStubResponse(options.task, options.messages);
    return {
      content: JSON.stringify(output),
      model_used: `stub:${options.task}`,
      tokens_used: 0,
      latency_ms: 0,
    };
  }
}

// ---------------------------------------------------------------------------
// OpenRouter provider
// ---------------------------------------------------------------------------

/** OpenRouter chat-completions endpoint. */
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Default per-attempt timeout (30s). */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Live provider. Walks the model chain starting at the tier's index,
 * retrying on 4xx/5xx/timeout/network. Throws when the chain is
 * exhausted. Reads the chain and tier starts from `packages/config`'s
 * env-resolved helpers — no hardcoded model IDs in this file.
 */
export class OpenRouterProvider implements AIProvider {
  readonly name = 'openrouter';

  private readonly apiKey: string;
  private readonly chain: readonly string[];
  private readonly tierStart: Record<'heavy' | 'medium' | 'light', number>;

  constructor(opts: { apiKey: string }) {
    this.apiKey = opts.apiKey;
    this.chain = resolveAIModelChain();
    this.tierStart = resolveAITierStart(this.chain);
  }

  async complete(options: AIRequestOptions): Promise<AIResponse> {
    const startIndex = this.tierStart[options.modelTier];
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const errors: string[] = [];

    for (let i = startIndex; i < this.chain.length; i++) {
      const model = this.chain[i];
      if (!model) continue;
      const startTime = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const body: Record<string, unknown> = {
          model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
        };
        if (options.max_tokens) body.max_tokens = options.max_tokens;
        if (options.response_format) body.response_format = options.response_format;

        const response = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
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
          const errText = await response.text().catch(() => 'Unknown error');
          errors.push(`[${model}] HTTP ${response.status}: ${errText}`);
          // 4xx, 429, 5xx all move to the next model
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
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`[${model}] ${message}`);
        }
        // Always continue to the next model on error
        if (latencyMs > 0) {
          // (kept the latency capture; future: structured error telemetry)
        }
      }
    }

    throw new Error(
      `[AI] All models in the ${options.modelTier} tier chain exhausted.\n` +
        `Attempted models: ${this.chain.slice(startIndex).join(', ')}\n` +
        `Errors:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let _provider: AIProvider | null = null;

/**
 * Returns the configured AI provider. Default is 'stub' (no key needed).
 * Setting AI_PROVIDER=openrouter requires:
 *   - OPENROUTER_API_KEY
 *   - A resolvable model chain (env AI_MODEL_CHAIN or the documented
 *     defaults). Validation happens in `resolveAIModelChain`.
 *
 * Loud config error on misconfig — no silent fallback to stub. The
 * whole module is exercisable on stub; live cutover is intentional.
 */
export function getAIProvider(): AIProvider {
  if (_provider) return _provider;

  const providerName = (process.env.AI_PROVIDER ?? 'stub').toLowerCase();

  switch (providerName) {
    case 'stub': {
      _provider = new StubAIProvider();
      return _provider;
    }
    case 'openrouter': {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error(
          '[AIProvider] AI_PROVIDER=openrouter but OPENROUTER_API_KEY is not set. ' +
            'Set the env var or switch back to AI_PROVIDER=stub.'
        );
      }
      // Validates the chain eagerly so misconfig surfaces here, not on
      // the first real call.
      const chain = resolveAIModelChain();
      if (chain.length === 0) {
        throw new Error(
          '[AIProvider] AI_PROVIDER=openrouter but the resolved model chain is empty. ' +
            'Set AI_MODEL_CHAIN or restore the defaults.'
        );
      }
      _provider = new OpenRouterProvider({ apiKey });
      return _provider;
    }
    default:
      throw new Error(
        `[AIProvider] Unknown AI_PROVIDER "${providerName}". Use "stub" or "openrouter".`
      );
  }
}

/**
 * Resets the provider singleton. Test-only — used to force a re-init
 * when env vars change at runtime (e.g. config validation tests).
 */
export function __resetAIProviderForTests(): void {
  _provider = null;
}

/**
 * Allows callers to inject a provider directly. Useful for tests that
 * want a custom stub (e.g. one that throws on a specific task to
 * verify the fail-open contract).
 */
export function __setAIProviderForTests(p: AIProvider | null): void {
  _provider = p;
}

// Re-export message type for downstream consumers
export type { AIMessage };
