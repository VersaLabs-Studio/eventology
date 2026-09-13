'use client';

// ============================================================================
// LiveAttendeeCount — POLLED check-in counter (HO-M)
// ============================================================================
// LOCKED: the live check-in count is POLLED (~15s), NOT realtime — adding
// `tickets`/`registrations` to the realtime publication would expose a
// high-churn, sensitive table's change stream for a number. The endpoint
// gates on attendee/host; this component only runs while the live window
// is open.
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { LiveCountKeys } from "@eventology/config";
import { Users } from "lucide-react";
import { useLocale } from "@/lib/i18n";

const POLL_INTERVAL_MS = 15_000;

export function LiveAttendeeCount({ eventId }: { eventId: string }) {
  const { t } = useLocale();

  const q = useQuery<{ count: number }>({
    queryKey: LiveCountKeys.byEvent(eventId),
    queryFn: async () => {
      const res = await fetch(`/api/protected/events/${eventId}/live-count`);
      if (!res.ok) throw new Error("live count unavailable");
      return res.json();
    },
    refetchInterval: POLL_INTERVAL_MS,
    // Keep the UI stable across polls — no refetch flicker.
    placeholderData: (prev) => prev,
  });

  if (q.isError) return null; // the panel must not break over the counter

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
      <Users className="h-3.5 w-3.5 text-primary" />
      {t("live.attendees", { count: q.data?.count ?? 0 })}
    </span>
  );
}
