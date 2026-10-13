'use client';

// ============================================================================
// Saved Events — Entity-Specific Hooks (V1.6 HO-4 web parity)
// ============================================================================
// Reads the caller's saved events (/saved page) and the lightweight id set
// every Save toggle checks. Save/unsave flip the id set optimistically and
// roll back on failure; the server is idempotent both ways (23505 → 200,
// DELETE of a missing row → 204).
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SavedEventKeys } from '@eventology/config';
import { useAuth } from '@/hooks/use-auth';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

async function readError(res: Response, fallback: string): Promise<Error> {
  const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
  return new Error(body.error?.message ?? fallback);
}

/** Saved events as raw joined rows — the caller runs them through transformEvent. */
export function useSavedEvents() {
  const { isAuthenticated } = useAuth();

  return useQuery<ListEnvelope<unknown>>({
    queryKey: SavedEventKeys.list(),
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch('/api/protected/saved-events?limit=100');
      if (!res.ok) throw await readError(res, 'Failed to load saved events');
      return res.json();
    },
  });
}

/**
 * The set of event ids the caller has saved. One cached query backs every
 * Save toggle on a page, so a grid of cards costs a single request.
 */
export function useSavedEventIds() {
  const { isAuthenticated } = useAuth();

  return useQuery<Set<string>>({
    queryKey: SavedEventKeys.ids(),
    enabled: isAuthenticated,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch('/api/protected/saved-events?view=ids');
      if (!res.ok) throw await readError(res, 'Failed to load saved events');
      const body: { data: string[] } = await res.json();
      return new Set(body.data);
    },
  });
}

interface ToggleContext {
  previous: Set<string> | undefined;
}

function useSavedToggle(method: 'POST' | 'DELETE') {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, ToggleContext>({
    mutationFn: async (eventId) => {
      const res = await fetch(
        method === 'POST' ? '/api/protected/saved-events' : `/api/protected/saved-events/${eventId}`,
        {
          method,
          headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
          body: method === 'POST' ? JSON.stringify({ event_id: eventId }) : undefined,
        }
      );
      if (!res.ok) throw await readError(res, 'Failed to update saved events');
    },
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: SavedEventKeys.ids() });
      const previous = queryClient.getQueryData<Set<string>>(SavedEventKeys.ids());
      const next = new Set(previous ?? []);
      if (method === 'POST') next.add(eventId);
      else next.delete(eventId);
      queryClient.setQueryData(SavedEventKeys.ids(), next);
      return { previous };
    },
    onError: (_err, _eventId, context) => {
      queryClient.setQueryData(SavedEventKeys.ids(), context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SavedEventKeys.all() });
    },
  });
}

/** Save an event. Optimistic with rollback. */
export function useSaveEvent() {
  return useSavedToggle('POST');
}

/** Unsave an event. Optimistic with rollback. */
export function useUnsaveEvent() {
  return useSavedToggle('DELETE');
}
