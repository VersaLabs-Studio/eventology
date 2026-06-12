"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { EventCard } from "@/components/shared/event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventById } from "@/lib/mock-data";

interface Recommendation {
  event_id: string;
  title: string;
  match_score: number;
  reason: string;
}

interface RecommendationsResponse {
  ok: boolean;
  data: Recommendation[];
}

/**
 * "Recommended for you" rail on the home page. Calls
 * /api/protected/recommendations; renders skeleton on load, graceful
 * empty state on AI failure (no 500, no error toast — the rail just
 * doesn't appear, per AI-007 fail-open).
 */
export function RecommendationsRail() {
  const [items, setItems] = React.useState<Recommendation[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/protected/recommendations", {
          credentials: "include",
        });
        if (!res.ok) {
          if (mounted) setItems([]);
          return;
        }
        const body = (await res.json()) as RecommendationsResponse;
        if (mounted) setItems(body.ok ? body.data : []);
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground mb-6 inline-flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Recommended for you
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) {
    // Graceful empty state: don't render the rail at all
    return null;
  }

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground inline-flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Recommended for you
              <span className="ml-2 inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary tracking-wider align-middle">
                AI
              </span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl font-medium">
              Picked from your past activity and the local scene.
            </p>
          </div>
          <Link
            href="/events"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-extrabold text-primary hover:text-accent transition-colors"
          >
            Explore all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.slice(0, 4).map((rec, idx) => {
            const event = getEventById(rec.event_id);
            if (!event) return null;
            return (
              <motion.div
                key={rec.event_id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
              >
                <div className="relative">
                  <EventCard event={event} />
                  <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-primary/95 text-primary-foreground text-[10px] font-extrabold backdrop-blur-sm shadow-md">
                    {Math.round(rec.match_score * 100)}% match
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
