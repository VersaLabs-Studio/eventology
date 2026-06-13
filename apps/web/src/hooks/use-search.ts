"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

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
 * R2: search hook now hits the real /api/public/events endpoint.
 * Debounces client-side on the query value via React's memoization;
 * the server-side route does the actual matching.
 */
export function useSearch() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  // 250ms debounce — match the rest of the app's perceived-latency budget
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  const eventsQ = useQuery<ListResponse<PublicEvent>>({
    queryKey: ['search', debounced],
    queryFn: async () => {
      if (!debounced) return { data: [], meta: { total: 0, page: 1, limit: 0 } };
      const res = await fetch(`/api/public/events?search=${encodeURIComponent(debounced)}&limit=30`);
      if (!res.ok) return { data: [], meta: { total: 0, page: 1, limit: 0 } };
      return res.json();
    },
    enabled: debounced.length > 0,
  });

  const results = useMemo(() => {
    return (eventsQ.data?.data ?? []).map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      shortDescription: e.short_description ?? '',
      description: e.description ?? '',
      bannerImage: e.banner_image ?? '',
      startDate: e.start_date,
      endDate: e.end_date,
      eventType: e.event_type,
      ticketType: e.ticket_type,
      isFeatured: e.is_featured,
      organizer: e.organizer
        ? { id: e.organizer.id, name: e.organizer.name, slug: e.organizer.slug, isVerified: e.organizer.is_verified }
        : null,
      category: e.category
        ? { id: e.category.id, name: e.category.name, slug: e.category.slug, color: e.category.color }
        : null,
      ticketTiers: e.ticket_tiers ?? [],
    }));
  }, [eventsQ.data]);

  return { query, setQuery, results, loading: eventsQ.isLoading };
}
