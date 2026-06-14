"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { EventCard } from "@/components/shared/event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@/lib/types";

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

interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  short_description: string | null;
  banner_image: string | null;
  start_date: string;
  end_date: string;
  event_type: string;
  ticket_type: 'free' | 'paid';
  is_featured: boolean;
  category?: { id: string; name: string; slug: string; color: string } | null;
  organizer?: { id: string; name: string; slug: string; is_verified: boolean } | null;
  ticket_tiers?: Array<{ id: string; name: string; price: number; currency: string }>;
}

interface ListResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

/**
 * R2: "Recommended for you" rail on the home page.
 * 1. Calls /api/protected/recommendations (AI-ranked ids).
 * 2. Resolves the full event row for each id via the public events list.
 * Renders skeleton on load, graceful empty state on AI failure.
 */
export function RecommendationsRail() {
  const recsQ = useQuery<RecommendationsResponse>({
    queryKey: ['ai', 'recommendations', 'rail'],
    queryFn: async () => {
      const res = await fetch('/api/protected/recommendations', { credentials: 'include' });
      if (!res.ok) return { ok: false, data: [] };
      return (await res.json()) as RecommendationsResponse;
    },
  });

  const recIds = recsQ.data?.data?.slice(0, 4).map((r) => r.event_id) ?? [];
  const matchScores = new Map(recsQ.data?.data?.map((r) => [r.event_id, r.match_score]) ?? []);

  const eventsQ = useQuery<ListResponse<PublicEvent>>({
    queryKey: ['events', 'public', 'recommendations'],
    queryFn: async () => {
      const res = await fetch('/api/public/events?limit=30&sort=date-asc');
      if (!res.ok) return { data: [], meta: { total: 0, page: 1, limit: 0 } };
      return res.json();
    },
  });

  const recommended = (eventsQ.data?.data ?? []).filter((e) => recIds.includes(e.id));

  const toDisplayEvent = (e: PublicEvent): Event => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    description: e.description ?? '',
    shortDescription: e.short_description ?? '',
    category: e.category
      ? { id: e.category.id, name: e.category.name, slug: e.category.slug, icon: '', description: '', eventCount: 0, color: e.category.color }
      : { id: '', name: '', slug: '', icon: '', description: '', eventCount: 0, color: '' },
    type: e.event_type as Event['type'],
    status: 'approved',
    date: e.start_date,
    endDate: e.end_date,
    time: '',
    endTime: '',
    location: '',
    address: '',
    subCity: '',
    coordinates: { lat: 0, lng: 0 },
    bannerImage: e.banner_image ?? '',
    gallery: [],
    organizer: e.organizer
      ? {
          id: e.organizer.id,
          name: e.organizer.name,
          slug: e.organizer.slug,
          email: '',
          phone: '',
          avatar: '',
          bio: '',
          verified: e.organizer.is_verified,
          eventsCount: 0,
          totalAttendees: 0,
          joinedDate: '',
        }
      : {
          id: '',
          name: '',
          slug: '',
          email: '',
          phone: '',
          avatar: '',
          bio: '',
          verified: false,
          eventsCount: 0,
          totalAttendees: 0,
          joinedDate: '',
        },
    ticketTiers: (e.ticket_tiers ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      price: t.price,
      currency: t.currency,
      capacity: 0,
      sold: 0,
      description: '',
    })),
    ticketType: e.ticket_type,
    tags: [],
    isFeatured: e.is_featured,
    views: 0,
    registrations: 0,
    capacity: 0,
    createdAt: '',
  });

  const loading = recsQ.isLoading || eventsQ.isLoading;
  const empty = !loading && recommended.length === 0;

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

  if (empty) {
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
          {recommended.slice(0, 4).map((rec, idx) => {
            const score = matchScores.get(rec.id);
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
              >
                <div className="relative">
                  <EventCard event={toDisplayEvent(rec)} />
                  {typeof score === 'number' && (
                    <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-primary/95 text-primary-foreground text-[10px] font-extrabold backdrop-blur-sm shadow-md">
                      {Math.round(score * 100)}% match
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
