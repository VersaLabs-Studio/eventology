// ============================================================================
// AI Init — wires the AI cache client once per server process
// ============================================================================
// The @eventology/ai cache module (ai_cache table, migration 018) is dead
// until it has a Supabase client. `setCacheClient` is the injection point;
// we call it once with the service-role client so the 18 services can
// read/write the cache without coupling to Supabase directly.
//
// Idempotent: calling multiple times is fine; the inner client is replaced.
// ============================================================================

import { setCacheClient } from '@eventology/ai';
import { createServiceClient } from '@/lib/supabase/server';

let _initialized = false;

/**
 * Initialize AI cache + verify provider resolution. Call from a server
 * entry point (a layout, a route, a module-level IIFE in a server-only
 * file). Safe to call more than once.
 */
export function initializeAI(): void {
  if (_initialized) return;

  // Cache client — service-role bypasses the ai_cache RLS lock
  setCacheClient(createServiceClient());

  // Touch the provider factory so misconfig surfaces at first request
  // (openrouter mode without OPENROUTER_API_KEY throws here, not deep
  // inside a service call). The factory memoizes; subsequent calls are
  // free.
  try {
    // Lazy import to keep the provider factory on the warm path
    const { getAIProvider } = require('@eventology/ai') as typeof import('@eventology/ai');
    getAIProvider();
  } catch (err) {
    // In dev (stub), this never throws. In openrouter mode without a
    // key, this throws — the route layer should treat the error as a
    // service-wide misconfig and return 503.
    console.error(
      '[AI Init] Provider factory failed:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }

  _initialized = true;
}
