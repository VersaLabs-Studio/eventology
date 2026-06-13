'use client';

// ============================================================================
// Organizer Stats
// ============================================================================
// Aggregates for the organizer dashboard. The route enforces ownership
// (admin bypass) and returns the standard OrganizerStats envelope.
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import type { OrganizerStats } from '@/app/api/protected/organizers/[id]/stats/route';

export type { OrganizerStats };

const STATS_KEY = (organizerId: string) => ['organizer-stats', organizerId] as const;

export function useOrganizerStats(organizerId: string | null) {
  return useQuery<OrganizerStats>({
    queryKey: STATS_KEY(organizerId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/protected/organizers/${organizerId}/stats`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to fetch stats');
      }
      return res.json();
    },
    enabled: !!organizerId,
    staleTime: 30_000,
  });
}
