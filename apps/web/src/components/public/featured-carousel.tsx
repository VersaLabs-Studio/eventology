"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { EventCard } from "@/components/shared/event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import type { Event } from "@/lib/types";

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
 * R2: Featured carousel now hits the real public events API with
 * `featured=true` (added to /api/public/events). RLS self-enforces
 * `status='approved'`. Falls back to a graceful empty state when the
 * platform has no featured events (admin hasn't pinned any yet).
 */
export function FeaturedCarousel() {
  const { t } = useLocale();
  const q = useQuery<ListResponse<PublicEvent>>({
    queryKey: ['events', 'featured-carousel'],
    queryFn: async () => {
      const res = await fetch('/api/public/events?featured=true&limit=12&sort=date-asc');
      if (!res.ok) throw new Error('Failed to load featured events');
      return res.json();
    },
  });

  const events = q.data?.data ?? [];
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Map the public response into the EventCard display shape (camelCase).
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

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 420;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (q.isLoading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[380px] w-[400px] shrink-0 rounded-xl" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title={t("events.featuredEmptyTitle")}
        description={t("events.featuredEmptyBody")}
      />
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {events.map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="snap-start"
          >
            <EventCard event={toDisplayEvent(event)} variant="featured" />
          </motion.div>
        ))}
      </div>

      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-10 w-10 rounded-full bg-card shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors z-10"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-10 w-10 rounded-full bg-card shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors z-10"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
