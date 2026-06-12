// ============================================================================
// AI Rate Limiter (AI-007)
// ============================================================================
// Per-(user, scope) sliding-window rate limit, backed by the
// `ai_rate_limit_buckets` table (migration 027). The limiter is the
// single chokepoint every AI route passes through. Each scope has its
// own cap (e.g. 'chat' = 20/min, 'organizer' = 30/min, 'admin' = 60/min).
//
// Algorithm:
//   1. UPSERT a bucket for (profile_id, scope) returning the current
//      row. Postgres returns the post-update state via RETURNING.
//   2. If `window_start` is older than `windowMs`, reset `count = 1`
//      and `window_start = now()`.
//   3. Otherwise increment `count` by 1.
//   4. Compare to the cap. If exceeded, the caller is rate-limited.
//
// We use a service-role client because the limiter is a system-level
// concern (RLS posture is "user reads own" only). RLS would otherwise
// block the read+write.
//
// Returns `{ ok, remaining, resetMs }` so routes can populate the
// standard `X-RateLimit-*` headers.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

export interface RateLimitConfig {
  /** Scope name (e.g. 'chat', 'organizer', 'admin', 'search'). */
  scope: string;
  /** Max allowed calls in the window. */
  max: number;
  /** Window length in ms. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Milliseconds until the current window resets. */
  resetMs: number;
  /** The configured cap (for header output). */
  limit: number;
}

/**
 * Standard rate-limit caps per scope. Conservative defaults that match
 * "an interactive user should never hit these on normal use, but a
 * runaway script will". Override per-route by passing a different config.
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  chat: { scope: 'chat', max: 20, windowMs: 60_000 },
  organizer: { scope: 'organizer', max: 30, windowMs: 60_000 },
  admin: { scope: 'admin', max: 60, windowMs: 60_000 },
  search: { scope: 'search', max: 30, windowMs: 60_000 },
  recommendations: { scope: 'recommendations', max: 30, windowMs: 60_000 },
  moderation: { scope: 'moderation', max: 30, windowMs: 60_000 },
  fraud: { scope: 'fraud', max: 60, windowMs: 60_000 },
};

/**
 * Acquire a single rate-limit token for (profile, scope). Returns ok=false
 * when the bucket is full. Idempotent / thread-safe enough: the UPSERT
 * is atomic and the increment is conditional.
 *
 * Service-role client is required — RLS on ai_rate_limit_buckets is
 * "user reads own" only.
 */
export async function consumeRateLimit(
  serviceClient: SupabaseClient,
  profileId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  // UPSERT: if the existing row's window_start is older than `windowStart`,
  // reset the bucket. Otherwise increment count.
  // Postgres syntax via the supabase-js rpc: we do an UPSERT then a
  // follow-up SELECT for clarity. Both run in the request handler.
  const { data: upserted, error: upsertError } = await serviceClient
    .from('ai_rate_limit_buckets')
    .upsert(
      {
        profile_id: profileId,
        scope: config.scope,
        count: 1,
        window_start: now.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: 'profile_id,scope' }
    )
    .select('count, window_start')
    .single();

  if (upsertError || !upserted) {
    // Best-effort: if the limiter is broken, let the call through.
    // The AI service itself is best-effort + fail-open, so the worst
    // case here is a few extra AI calls during a DB blip.
    console.warn('[RateLimit] UPSERT failed; allowing call:', upsertError?.message);
    return { ok: true, remaining: config.max, resetMs: config.windowMs, limit: config.max };
  }

  const storedWindowStart = new Date(upserted.window_start);
  const storedCount = Number(upserted.count);

  if (storedWindowStart < windowStart) {
    // Window has rolled over — reset
    await serviceClient
      .from('ai_rate_limit_buckets')
      .update({
        count: 1,
        window_start: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('profile_id', profileId)
      .eq('scope', config.scope);

    return { ok: true, remaining: config.max - 1, resetMs: config.windowMs, limit: config.max };
  }

  // Inside the current window — was this call within the cap?
  if (storedCount > config.max) {
    const resetMs = storedWindowStart.getTime() + config.windowMs - now.getTime();
    return { ok: false, remaining: 0, resetMs: Math.max(0, resetMs), limit: config.max };
  }

  // Increment count for this call
  const nextCount = storedCount + 1;
  await serviceClient
    .from('ai_rate_limit_buckets')
    .update({ count: nextCount, updated_at: now.toISOString() })
    .eq('profile_id', profileId)
    .eq('scope', config.scope);

  return {
    ok: true,
    remaining: Math.max(0, config.max - nextCount),
    resetMs: Math.max(0, storedWindowStart.getTime() + config.windowMs - now.getTime()),
    limit: config.max,
  };
}

/**
 * Wraps a route handler with the standard rate-limit headers. Use:
 *
 *   const limited = await consumeRateLimit(svc, userId, RATE_LIMITS.chat);
 *   if (!limited.ok) return rateLimitResponse(limited);
 *   // ... do work ...
 *   return rateLimitHeaders(limited) ? NextResponse.json(data, { headers: ... }) : ...
 */
export function rateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetMs / 1000)),
  };
}
