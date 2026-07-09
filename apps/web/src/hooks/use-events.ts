'use client';

// ============================================================================
// Events — Entity-Specific Hooks
// ============================================================================
// Thin wrappers around the generic factory hooks, specialized for Events.
// Provides slug lookup, featured events, and the standard CRUD surface.
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { EventKeys } from '@eventology/config';
import { useList, useDoc, useCreate, useUpdate, useDelete } from '@/hooks/factory';
import type { ListOptions, ListResponse } from '@/hooks/factory';
import type { Tables, EventFormData, EventUpdateData } from '@eventology/schemas';
import { transformEvent } from '@/lib/transformers';
import type { Event } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventRow = Tables<'events'>;
// EventFormData / EventUpdateData are the canonical schema-inferred types
// (packages/schemas). They are re-exported here so feature hooks and forms
// import a single source of truth.

// ---------------------------------------------------------------------------
// List hook — returns enriched Event[] with joined relations
// ---------------------------------------------------------------------------

export function useEvents(options?: ListOptions & {
  date?: string;
  from?: string;
  to?: string;
  price?: string;
  city?: string;
  venue?: string;
  type?: string;
}) {
  return useQuery<ListResponse<Event>>({
    queryKey: EventKeys.list(options),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.search) params.set('search', options.search);
      if (options?.category) params.set('category', options.category);
      if (options?.sort) params.set('sort', options.sort);
      if (options?.date) params.set('date', options.date);
      if (options?.from) params.set('from', options.from);
      if (options?.to) params.set('to', options.to);
      if (options?.price) params.set('price', options.price);
      if (options?.city) params.set('city', options.city);
      if (options?.venue) params.set('venue', options.venue);
      if (options?.type) params.set('type', options.type);

      const url = params.toString()
        ? `/api/public/events?${params}`
        : '/api/public/events';

      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? 'Failed to fetch events'
        );
      }

      const json = await res.json();
      return {
        data: (json.data as unknown[]).map((e) => transformEvent(e as Parameters<typeof transformEvent>[0])),
        total: json.meta.total,
        page: json.meta.page,
        limit: json.meta.limit,
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Single document hooks
// ---------------------------------------------------------------------------

export function useEvent(id: string | null) {
  return useDoc<EventRow>('events', id);
}

export function useEventBySlug(slug: string | null) {
  return useQuery<Event>({
    queryKey: EventKeys.bySlug(slug ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/public/events/${slug}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? 'Event not found'
        );
      }
      const raw = await res.json();
      return transformEvent(raw);
    },
    enabled: !!slug,
  });
}

// ---------------------------------------------------------------------------
// Featured events
// ---------------------------------------------------------------------------

export function useFeaturedEvents() {
  return useQuery<ListResponse<Event>>({
    queryKey: EventKeys.featured(),
    queryFn: async () => {
      const res = await fetch('/api/public/events?limit=5&sort=featured');
      if (!res.ok) throw new Error('Failed to fetch featured events');
      const json = await res.json();
      return {
        data: (json.data as unknown[]).map((e) => transformEvent(e as Parameters<typeof transformEvent>[0])),
        total: json.meta.total,
        page: json.meta.page,
        limit: json.meta.limit,
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations (raw DB shape — used by forms)
// ---------------------------------------------------------------------------

export function useCreateEvent() {
  return useCreate<EventFormData, EventRow>('events');
}

export function useUpdateEvent() {
  return useUpdate<EventUpdateData, EventRow>('events');
}

export function useDeleteEvent() {
  return useDelete('events');
}
