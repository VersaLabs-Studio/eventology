'use client';

// ============================================================================
// Event Analytics (organizer-scoped)
// ============================================================================
// Wraps /api/protected/organizers/[id]/events/[eventId]/analytics.
// Ownership enforced at the app layer (caller must own the event).
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import type { EventAnalytics } from '@/app/api/protected/organizers/[id]/events/[eventId]/analytics/route';

export type { EventAnalytics };

const KEY = (organizerId: string, eventId: string) =>
  ['event-analytics', organizerId, eventId] as const;

export function useEventAnalytics(organizerId: string | null, eventId: string | null) {
  return useQuery<EventAnalytics>({
    queryKey: KEY(organizerId ?? '', eventId ?? ''),
    queryFn: async () => {
      const res = await fetch(
        `/api/protected/organizers/${organizerId}/events/${eventId}/analytics`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to fetch analytics');
      }
      return res.json();
    },
    enabled: !!organizerId && !!eventId,
    staleTime: 30_000,
  });
}
