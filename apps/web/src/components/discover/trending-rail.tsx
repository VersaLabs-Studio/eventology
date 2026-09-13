'use client';

// ============================================================================
// TrendingRail — "Trending now" (HO-J)
// ============================================================================
// Composes the EXISTING /api/public/events endpoint with sort=popular
// (registrations_count desc). Public — no session gate needed.
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { DiscoverKeys } from "@eventology/config";
import { EventCard } from "@/components/shared/event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { RailHeading } from "@/components/discover/weekend-rail";
import { transformEvent } from "@/lib/transformers";
import { useLocale } from "@/lib/i18n";
import { Flame } from "lucide-react";

export function TrendingRail() {
  const { t } = useLocale();

  const q = useQuery({
    queryKey: DiscoverKeys.nearby("trending"), // stable namespaced key under discover
    queryFn: async () => {
      const res = await fetch("/api/public/events?sort=popular&limit=8");
      if (!res.ok) throw new Error("trending load failed");
      return (await res.json()) as { data: unknown[] };
    },
  });

  if (q.isError) return null; // fail independently
  if (q.isLoading) {
    return (
      <section className="space-y-4" aria-label={t("discover.trendingTitle")}>
        <RailHeading icon={Flame} titleKey="discover.trendingTitle" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  const events = (q.data?.data ?? []).map((e) => transformEvent(e as Parameters<typeof transformEvent>[0]));
  if (events.length === 0) return null;

  return (
    <section className="space-y-4" aria-label={t("discover.trendingTitle")}>
      <RailHeading icon={Flame} titleKey="discover.trendingTitle" href="/events?sort=popular" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {events.slice(0, 8).map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
