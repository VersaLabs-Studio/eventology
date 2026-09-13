'use client';

// ============================================================================
// ForYouRail — "Because you follow…" (HO-J)
// ============================================================================
// Gated rail (LOCKED): renders ONLY for a signed-in session with ≥1 user
// follow (checked via the public social-counts endpoint on user_follows);
// otherwise omitted entirely — never shown empty.
//
// Data: the existing /api/protected/feed (HO-A) — the activity feed already
// scopes rows via RLS to followed actors + self. Feed rows embed a minimal
// event projection (id, title, slug, banner_image), so this rail renders
// mini-cards rather than the full EventCard (documented assumption: no
// existing endpoint returns full event cards for a follow-graph filter).
// ============================================================================

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DiscoverKeys } from "@eventology/config";
import { Skeleton } from "@/components/ui/skeleton";
import { RailHeading } from "@/components/discover/weekend-rail";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/lib/i18n";
import { HeartHandshake } from "lucide-react";

interface FeedEventEmbed {
  id: string;
  title: string;
  slug: string;
  banner_image: string | null;
}

export function ForYouRail() {
  const { t } = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  // Gate 1: session — signed-out users never even fetch.
  const enabled = !!user?.id && !authLoading;

  // Gate 2: ≥1 user follow (user_follows counts via the public social endpoint).
  const socialQ = useQuery<{ followers: number; following: number }>({
    queryKey: [...DiscoverKeys.forYou(), "social", user?.id ?? ""],
    queryFn: async () => {
      const res = await fetch(`/api/public/users/${user!.id}/social`);
      if (!res.ok) throw new Error("social load failed");
      return res.json();
    },
    enabled,
  });

  // Data: the follow-scoped activity feed.
  const feedQ = useQuery<{ data: Array<{ event?: FeedEventEmbed | null }> }>({
    queryKey: DiscoverKeys.forYou(),
    queryFn: async () => {
      const res = await fetch("/api/protected/feed?limit=40");
      if (!res.ok) throw new Error("feed load failed");
      return res.json();
    },
    enabled: enabled && (socialQ.data?.following ?? 0) > 0,
  });

  if (!enabled) return null; // signed out → absent, not empty
  if (socialQ.isLoading || socialQ.isError) return null;
  if ((socialQ.data?.following ?? 0) === 0) return null; // following nobody → absent

  if (feedQ.isLoading) {
    return (
      <section className="space-y-4" aria-label={t("discover.forYouTitle")}>
        <RailHeading icon={HeartHandshake} titleKey="discover.forYouTitle" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (feedQ.isError) return null; // fail independently

  // Dedupe events across activity rows (many actors touch the same event).
  const events: FeedEventEmbed[] = [];
  const seen = new Set<string>();
  for (const row of feedQ.data?.data ?? []) {
    const ev = row.event;
    if (!ev?.slug || seen.has(ev.slug)) continue;
    seen.add(ev.slug);
    events.push(ev);
  }
  if (events.length === 0) return null;

  return (
    <section className="space-y-4" aria-label={t("discover.forYouTitle")}>
      <RailHeading icon={HeartHandshake} titleKey="discover.forYouTitle" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {events.slice(0, 8).map((ev) => (
          <Link
            key={ev.id}
            href={`/events/${ev.slug}`}
            className="group relative h-40 rounded-2xl overflow-hidden border border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Image
              src={ev.banner_image || "/images/placeholders/event.svg"}
              alt={ev.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <p className="absolute bottom-3 left-3 right-3 text-sm font-bold text-white line-clamp-2">
              {ev.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
