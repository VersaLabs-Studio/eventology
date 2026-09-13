'use client';

// ============================================================================
// WeekendRail — "This weekend" (HO-J)
// ============================================================================
// Composes the EXISTING /api/public/events endpoint with from/to date
// filters (Sat 00:00 → Mon 00:00 local). Independent query — a failure
// here omits the rail without touching the rest of the hub.
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DiscoverKeys } from "@eventology/config";
import { EventCard } from "@/components/shared/event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { transformEvent } from "@/lib/transformers";
import { useLocale } from "@/lib/i18n";
import { CalendarRange, ChevronRight } from "lucide-react";
import type { DiscoverRail } from "@/lib/discover/types";

/** Next Saturday 00:00 → Monday 00:00 (the weekend window). */
function weekendWindow(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay(); // 0 Sun … 6 Sat
  const daysUntilSat = (6 - day + 7) % 7;
  const sat = new Date(now);
  sat.setDate(now.getDate() + daysUntilSat);
  sat.setHours(0, 0, 0, 0);
  const mon = new Date(sat);
  mon.setDate(sat.getDate() + 2);
  return { from: sat.toISOString(), to: mon.toISOString() };
}

export function WeekendRail() {
  const { t } = useLocale();

  const q = useQuery({
    queryKey: DiscoverKeys.weekend(),
    queryFn: async () => {
      const { from, to } = weekendWindow();
      const res = await fetch(
        `/api/public/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&sort=date-asc&limit=8`
      );
      if (!res.ok) throw new Error("weekend load failed");
      return (await res.json()) as { data: unknown[] };
    },
  });

  if (q.isError) return null; // fail independently — omit the rail
  if (q.isLoading) {
    return (
      <section className="space-y-4">
        <RailHeading icon={CalendarRange} titleKey="discover.weekendTitle" />
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
    <DiscoverRailShell
      rail={{ id: "weekend", titleKey: "discover.weekendTitle", kind: "weekend", events }}
      icon={CalendarRange}
      href="/events"
    />
  );
}

// ---------------------------------------------------------------------------
// Shared rail chrome (heading + grid). Exported for the sibling rails.
// ---------------------------------------------------------------------------

export function RailHeading({
  icon: Icon,
  titleKey,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  href?: string;
}) {
  const { t } = useLocale();
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-display font-bold text-xl flex items-center gap-2">
        <Icon />
        {t(titleKey)}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-0.5"
        >
          {t("discover.seeAll")}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export function DiscoverRailShell({
  rail,
  icon,
  href,
}: {
  rail: DiscoverRail;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}) {
  const { t } = useLocale();
  return (
    <section className="space-y-4" aria-label={t(rail.titleKey)}>
      <RailHeading icon={icon} titleKey={rail.titleKey} href={href} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {rail.events.slice(0, 8).map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
