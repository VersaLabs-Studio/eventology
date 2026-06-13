"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { EventCard } from "@/components/shared/event-card";
import { SearchBar } from "@/components/shared/search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { AISearchPanel } from "@/components/ai/ai-search-panel";
import { useQuery } from "@tanstack/react-query";
import { Search, Lightbulb } from "lucide-react";
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

function toDisplayEvent(e: PublicEvent): Event {
  return {
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
      id: t.id, name: t.name, price: t.price, currency: t.currency,
      capacity: 0, sold: 0, description: '',
    })),
    ticketType: e.ticket_type,
    tags: [],
    isFeatured: e.is_featured,
    views: 0, registrations: 0, capacity: 0, createdAt: '',
  };
}

interface InterpretResponse {
  ok: boolean;
  data: {
    interpreted_query: string;
    filters: {
      categories?: string[];
      event_types?: string[];
      locations?: string[];
      date_range?: { start?: string; end?: string };
      price_range?: { min?: number; max?: number };
      tags?: string[];
    };
    keywords: string[];
    intent: string;
  } | null;
  reason?: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = React.useState(q);
  const [category, setCategory] = React.useState<string>('');
  const [dateRange, setDateRange] = React.useState<{ from?: string; to?: string }>({});
  const [priceFilter, setPriceFilter] = React.useState<'free' | 'paid' | ''>('');

  const interpretQ = useQuery<InterpretResponse | null>({
    queryKey: ['search', 'interpret', query],
    queryFn: async () => {
      if (query.length < 2) return null;
      try {
        const res = await fetch('/api/public/search/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    enabled: query.length >= 2,
  });

  // When the interpreter returns, fold its filters into the local state
  React.useEffect(() => {
    const data = interpretQ.data?.data;
    if (!data) return;
    if (data.filters.categories?.[0]) setCategory(data.filters.categories[0]);
    if (data.filters.date_range) setDateRange({ from: data.filters.date_range.start, to: data.filters.date_range.end });
    if (data.filters.price_range) {
      // Best-effort: if min==0 → free, if max>0 → paid. The interpreter
      // is a heuristic — the events list is the source of truth.
      if (data.filters.price_range.min === 0 && !data.filters.price_range.max) {
        setPriceFilter('free');
      } else if (data.filters.price_range.min && data.filters.price_range.min > 0) {
        setPriceFilter('paid');
      }
    }
  }, [interpretQ.data]);

  const eventsQ = useQuery<ListResponse<PublicEvent>>({
    queryKey: ['search', 'events', query, category, dateRange.from, dateRange.to, priceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', '30');
      if (query) params.set('search', query);
      if (category) params.set('category', category);
      if (dateRange.from) params.set('from', dateRange.from);
      if (dateRange.to) params.set('to', dateRange.to);
      if (priceFilter === 'free') params.set('price', 'free');
      if (priceFilter === 'paid') params.set('price', 'paid');
      const res = await fetch(`/api/public/events?${params.toString()}`);
      if (!res.ok) return { data: [], meta: { total: 0, page: 1, limit: 0 } };
      return res.json();
    },
    enabled: query.length > 0,
  });

  const results = (eventsQ.data?.data ?? []).map(toDisplayEvent);

  const handleApplyFilters = (filters: {
    categories?: string[];
    event_types?: string[];
    locations?: string[];
    tags?: string[];
  }) => {
    if (filters.categories?.[0]) setCategory(filters.categories[0]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Search Results" />
      <div className="mb-6">
        <SearchBar
          variant="compact"
          placeholder="Search events, organizers, or venues..."
          value={query}
          onChange={setQuery}
          className="max-w-xl"
        />
      </div>

      <AISearchPanel query={query} onApply={handleApplyFilters} />

      {query && (
        <p className="text-sm text-muted-foreground mb-6">
          {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
        </p>
      )}

      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <EventCard event={event} variant="horizontal" />
            </motion.div>
          ))}
        </div>
      ) : query && !eventsQ.isLoading ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description={`We couldn't find any events matching "${query}". Try searching for 'conference', 'workshop', or 'music'.`}
        />
      ) : (
        <EmptyState
          icon={Lightbulb}
          title="Search for events"
          description="Try searching for 'conference', 'workshop', or 'music'"
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
