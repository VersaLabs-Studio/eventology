'use client';

// ============================================================================
// Realtime Auth — the HO-M auth bridge (client side)
// ============================================================================
// The browser Supabase client is anon-keyed and this app uses better-auth,
// so a raw socket has auth.uid() = NULL and RLS-gated realtime streams
// yield NOTHING. This hook:
//   1. fetches a 10m Supabase JWT from /api/protected/realtime-token,
//   2. feeds it to supabase.realtime.setAuth() BEFORE any subscription,
//   3. re-fetches + re-calls setAuth ~60s BEFORE expiry — setAuth updates
//      the socket's access token WITHOUT dropping active subscriptions.
// Never fetches the service key; never disables RLS (LOCKED).
// ============================================================================

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

const TOKEN_REFRESH_LEEWAY_MS = 60_000;
const MIN_REFRESH_INTERVAL_MS = 30_000;
const RETRY_INTERVAL_MS = 30_000;

export function useRealtimeAuth(enabled: boolean): { ready: boolean } {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const apply = async () => {
      if (cancelled) return;
      try {
        const res = await fetch("/api/protected/realtime-token");
        if (!res.ok) {
          // Signed out or server hiccup — retry; the subscription will
          // start (or resume receiving rows) once auth lands.
          timer = setTimeout(apply, RETRY_INTERVAL_MS);
          return;
        }
        const { token, expiresAt } = (await res.json()) as {
          token: string;
          expiresAt: string;
        };

        const supabase = createClient();
        // Updates the socket's access token in place — existing
        // subscriptions are preserved (the refresh path never re-subscribes).
        await supabase.realtime.setAuth(token);

        if (!cancelled) setReady(true);

        // Refresh ~60s before expiry (never tighter than 30s).
        const msUntilExpiry = new Date(expiresAt).getTime() - Date.now();
        const refreshIn = Math.max(
          MIN_REFRESH_INTERVAL_MS,
          msUntilExpiry - TOKEN_REFRESH_LEEWAY_MS
        );
        timer = setTimeout(apply, refreshIn);
      } catch {
        // Offline / network blip — retry; setReady stays as-is.
        if (!cancelled) timer = setTimeout(apply, RETRY_INTERVAL_MS);
      }
    };

    void apply();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled]);

  return { ready };
}
