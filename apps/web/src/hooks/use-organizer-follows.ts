'use client';

// ============================================================================
// Organizer Follows — Entity-Specific Hooks (V1.6 HO-4 web parity)
// ============================================================================
// Distinct from use-user-follows (HO-A person-to-person graph): this is the
// attendee → organizer follow from migration 037. Same optimistic id-set
// pattern as use-saved-events.
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OrganizerFollowKeys } from '@eventology/config';
import { useAuth } from '@/hooks/use-auth';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

/** Organizer card as served by GET /api/protected/follows. */
export interface FollowedOrganizer {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  events_count: number | null;
}

async function readError(res: Response, fallback: string): Promise<Error> {
  const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
  return new Error(body.error?.message ?? fallback);
}

export function useFollowedOrganizers() {
  const { isAuthenticated } = useAuth();

  return useQuery<ListEnvelope<FollowedOrganizer>>({
    queryKey: OrganizerFollowKeys.list(),
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch('/api/protected/follows?limit=100');
      if (!res.ok) throw await readError(res, 'Failed to load followed organizers');
      return res.json();
    },
  });
}

/** The set of organizer ids the caller follows (backs every Follow toggle). */
export function useFollowedOrganizerIds() {
  const { isAuthenticated } = useAuth();

  return useQuery<Set<string>>({
    queryKey: OrganizerFollowKeys.ids(),
    enabled: isAuthenticated,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch('/api/protected/follows?view=ids');
      if (!res.ok) throw await readError(res, 'Failed to load followed organizers');
      const body: { data: string[] } = await res.json();
      return new Set(body.data);
    },
  });
}

interface ToggleContext {
  previous: Set<string> | undefined;
}

function useFollowToggle(method: 'POST' | 'DELETE') {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, ToggleContext>({
    mutationFn: async (organizerId) => {
      const res = await fetch(
        method === 'POST' ? '/api/protected/follows' : `/api/protected/follows/${organizerId}`,
        {
          method,
          headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
          body: method === 'POST' ? JSON.stringify({ organizer_id: organizerId }) : undefined,
        }
      );
      if (!res.ok) throw await readError(res, 'Failed to update follow');
    },
    onMutate: async (organizerId) => {
      await queryClient.cancelQueries({ queryKey: OrganizerFollowKeys.ids() });
      const previous = queryClient.getQueryData<Set<string>>(OrganizerFollowKeys.ids());
      const next = new Set(previous ?? []);
      if (method === 'POST') next.add(organizerId);
      else next.delete(organizerId);
      queryClient.setQueryData(OrganizerFollowKeys.ids(), next);
      return { previous };
    },
    onError: (_err, _organizerId, context) => {
      queryClient.setQueryData(OrganizerFollowKeys.ids(), context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: OrganizerFollowKeys.all() });
    },
  });
}

export function useFollowOrganizer() {
  return useFollowToggle('POST');
}

export function useUnfollowOrganizer() {
  return useFollowToggle('DELETE');
}
