'use client';

// ============================================================================
// FeaturedCollections — editorial rails (HO-J)
// ============================================================================
// Consumes the EXISTING /api/public/collections/featured (HO-C) — the route
// was explicitly built "consumed by discovery surfaces (HO-J)". Fails
// independently: an error omits the section.
// ============================================================================

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DiscoverKeys } from "@eventology/config";
import { Skeleton } from "@/components/ui/skeleton";
import { RailHeading } from "@/components/discover/weekend-rail";
import { useLocale } from "@/lib/i18n";
import { LibraryBig } from "lucide-react";

interface FeaturedCollection {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  cover_url: string | null;
  event_count: number;
}

export function FeaturedCollections() {
  const { t } = useLocale();

  const q = useQuery<{ data: FeaturedCollection[] }>({
    queryKey: DiscoverKeys.featuredCollections(),
    queryFn: async () => {
      const res = await fetch("/api/public/collections/featured?limit=6");
      if (!res.ok) throw new Error("featured collections load failed");
      return res.json();
    },
  });

  if (q.isError) return null; // fail independently
  if (q.isLoading) {
    return (
      <section className="space-y-4" aria-label={t("discover.collectionsTitle")}>
        <RailHeading icon={LibraryBig} titleKey="discover.collectionsTitle" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  const collections = q.data?.data ?? [];
  if (collections.length === 0) return null;

  return (
    <section className="space-y-4" aria-label={t("discover.collectionsTitle")}>
      <RailHeading icon={LibraryBig} titleKey="discover.collectionsTitle" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {collections.map((c) => (
          <Link
            key={c.id}
            href={`/collections/${c.slug}`}
            className="group relative h-44 rounded-2xl overflow-hidden border border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Image
              src={c.cover_url || "/images/placeholders/event.svg"}
              alt={c.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="font-display font-bold text-white line-clamp-1">{c.title}</p>
              {c.description && (
                <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{c.description}</p>
              )}
              <p className="text-[11px] font-bold text-white/70 mt-1 uppercase tracking-wider">
                {t("discover.eventCount", { count: c.event_count })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
