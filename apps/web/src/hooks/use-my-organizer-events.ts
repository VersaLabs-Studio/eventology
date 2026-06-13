'use client';

// ============================================================================
// My Organizer Events
// ============================================================================
// Returns the caller's events (any status — drafts + pending included).
// Used by the org dashboard "My Events" list + the org dashboard's
// stats widget. The authed + RLS path keeps each row ownership-scoped.
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { EventKeys } from '@eventology/config';
import type { MyEventRow } from '@/app/api/protected/events/route';

export type { MyEventRow };

interface MyEventsResponse {
  data: MyEventRow[];
  meta: { total: number; page: number; limit: number };
}

export function useMyOrganizerEvents(options?: { status?: string; limit?: number; page?: number }) {
  return useQuery<MyEventsResponse>({
    queryKey: [...EventKeys.list({ scope: 'mine', ...options })] as const,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.status) params.set('status', options.status);
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.page) params.set('page', String(options.page));
      const qs = params.toString();
      const res = await fetch(`/api/protected/events${qs ? `?${qs}` : ''}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to fetch events');
      }
      return res.json();
    },
  });
}
