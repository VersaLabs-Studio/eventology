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
import type { Tables } from '@eventology/schemas';
import { transformEvent } from '@/lib/transformers';
import type { Event } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventRow = Tables<'events'>;
export type EventFormData = {
  title: string;
  slug: string;
  description?: string;
  short_description?: string;
  banner_image?: string;
  category_id: string;
  organizer_id: string;
  event_type: string;
  ticket_type?: string;
  start_date: string;
  end_date: string;
  timezone?: string;
  venue_name?: string;
  venue_address?: string;
  sub_city?: string;
  capacity?: number;
  tags?: string[];
  gallery?: string[];
  metadata?: Record<string, unknown>;
};

export type EventUpdateData = Partial<EventFormData> & {
  status?: string;
  rejection_reason?: string;
  is_featured?: boolean;
  featured_until?: string;
};

// ---------------------------------------------------------------------------
// List hook — returns enriched Event[] with joined relations
// ---------------------------------------------------------------------------

export function useEvents(options?: ListOptions) {
  return useQuery<ListResponse<Event>>({
    queryKey: EventKeys.list(options),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.search) params.set('search', options.search);
      if (options?.category) params.set('category', options.category);
      if (options?.sort) params.set('sort', options.sort);

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
