'use client';

// ============================================================================
// Live Event — realtime announcements hook (HO-M)
// ============================================================================
// Owns the event_announcements channel lifecycle:
//   - backfill GET (RLS-scoped; response carries viewer.isHost),
//   - realtime INSERT subscription (setAuth'd via useRealtimeAuth),
//   - dedupe by id across backfill + realtime + own posts,
//   - TEARDOWN on unmount (removeChannel — no leaked channels on
//     navigation).
//
// Subscription starts only AFTER the realtime auth bridge reports ready —
// subscribing earlier would stream zero rows (anon socket).
// ============================================================================

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeAuth } from "@/lib/hooks/use-realtime-auth";
import type { ErrorEnvelope } from "@/lib/api";

export interface LiveAnnouncement {
  id: string;
  event_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export type LiveEventStatus = "connecting" | "loading" | "live" | "denied" | "error";

interface BackfillResponse {
  data: LiveAnnouncement[];
  viewer: { isHost: boolean };
}

export function useLiveEvent(eventId: string | null, enabled: boolean) {
  const { ready } = useRealtimeAuth(enabled && !!eventId);

  const [announcements, setAnnouncements] = React.useState<LiveAnnouncement[]>([]);
  const [status, setStatus] = React.useState<LiveEventStatus>("connecting");
  const [isHost, setIsHost] = React.useState(false);
  const [posting, setPosting] = React.useState(false);

  // Backfill — RLS scopes rows; an empty result for a non-attendee looks
  // identical to "no announcements yet", so a 403 never leaks access state.
  React.useEffect(() => {
    if (!ready || !eventId || !enabled) return;

    let cancelled = false;
    setStatus((s) => (s === "live" ? s : "loading"));

    fetch(`/api/protected/events/${eventId}/announcements`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setStatus("error");
          return;
        }
        const body = (await res.json()) as BackfillResponse;
        setIsHost(body.viewer.isHost);
        setAnnouncements((prev) => dedupeAppend(prev, body.data));
        setStatus("live");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [ready, eventId, enabled]);

  // Realtime subscription — torn down on unmount/param change.
  React.useEffect(() => {
    if (!ready || !eventId || !enabled) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`event-announcements-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_announcements",
          filter: `event_id=eq.${eventId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as unknown as LiveAnnouncement;
          if (!row?.id) return;
          setAnnouncements((prev) => dedupeAppend(prev, [row]));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ready, eventId, enabled]);

  // Host post — server-injects authorship; the created row is appended
  // (deduped — the realtime echo of our own INSERT arrives separately).
  const post = React.useCallback(
    async (body: string): Promise<boolean> => {
      if (!eventId) return false;
      setPosting(true);
      try {
        const res = await fetch(`/api/protected/events/${eventId}/announcements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        if (!res.ok) {
          const err: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
          throw new Error(err.error?.message ?? "Failed to post announcement");
        }
        const row = (await res.json()) as LiveAnnouncement;
        setAnnouncements((prev) => dedupeAppend(prev, [row]));
        return true;
      } finally {
        setPosting(false);
      }
    },
    [eventId]
  );

  return { announcements, status, isHost, post, posting };
}

// ---------------------------------------------------------------------------
// Dedupe — backfill, realtime echo, and optimistic own-post all converge.
// ---------------------------------------------------------------------------

function dedupeAppend(
  prev: LiveAnnouncement[],
  incoming: LiveAnnouncement[]
): LiveAnnouncement[] {
  const seen = new Set(prev.map((a) => a.id));
  const merged = [...prev];
  for (const row of incoming) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
  }
  // Chronological order regardless of arrival order.
  merged.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return merged;
}
