'use client';

// ============================================================================
// Event Q&A — Entity-Specific Hooks (HO-B)
// ============================================================================
// Read: GET /api/public/events/[slug]/questions (public; session enhances
// with my_vote + viewer.isHost). Mutations: protected routes keyed by ids.
// Any QA mutation invalidates the whole EventQaKeys.all() surface — matches
// the factory convention (all() invalidation on mutation).
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EventQaKeys } from '@eventology/config';
import type { ErrorEnvelope } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types (shaped to the public GET response)
// ---------------------------------------------------------------------------

export interface QaAuthor {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface QaAnswer {
  id: string;
  body: string;
  is_official: boolean;
  is_hidden: boolean;
  created_at: string;
  author_id: string;
  author: QaAuthor | null;
}

export interface QaQuestion {
  id: string;
  body: string;
  is_pinned: boolean;
  is_hidden: boolean;
  upvotes: number;
  created_at: string;
  author_id: string;
  author: QaAuthor | null;
  answers: QaAnswer[];
  my_vote: boolean;
}

export interface EventQaResponse {
  data: QaQuestion[];
  meta: { total: number; page: number; limit: number };
  viewer: { isHost: boolean };
}

// ---------------------------------------------------------------------------
// Read hook
// ---------------------------------------------------------------------------

export function useEventQa(slug: string | null) {
  return useQuery<EventQaResponse>({
    queryKey: EventQaKeys.byEvent(slug ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/public/events/${slug}/questions`);
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to load Q&A');
      }
      return res.json();
    },
    enabled: !!slug,
  });
}

// ---------------------------------------------------------------------------
// Mutation plumbing
// ---------------------------------------------------------------------------

function useInvalidateQa() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: EventQaKeys.all() });
}

async function qaFetch(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 204) {
    const envelope: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
    throw new Error(envelope.error?.message ?? 'Request failed');
  }
  return res;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useAskQuestion(eventId: string) {
  const invalidate = useInvalidateQa();
  return useMutation<void, Error, string>({
    mutationFn: async (body) => {
      await qaFetch(`/api/protected/events/${eventId}/questions`, 'POST', { event_id: eventId, body });
    },
    onSuccess: invalidate,
  });
}

export function useVoteQuestion() {
  const invalidate = useInvalidateQa();
  return useMutation<void, Error, string>({
    mutationFn: async (questionId) => {
      await qaFetch(`/api/protected/questions/${questionId}/vote`, 'POST');
    },
    onSuccess: invalidate,
  });
}

export function useUnvoteQuestion() {
  const invalidate = useInvalidateQa();
  return useMutation<void, Error, string>({
    mutationFn: async (questionId) => {
      await qaFetch(`/api/protected/questions/${questionId}/vote`, 'DELETE');
    },
    onSuccess: invalidate,
  });
}

export function useDeleteQuestion() {
  const invalidate = useInvalidateQa();
  return useMutation<void, Error, string>({
    mutationFn: async (questionId) => {
      await qaFetch(`/api/protected/questions/${questionId}`, 'DELETE');
    },
    onSuccess: invalidate,
  });
}

/** Pin/hide a question (host-only, enforced server-side). */
export function useModerateQuestion() {
  const invalidate = useInvalidateQa();
  return useMutation<void, Error, { questionId: string; is_pinned?: boolean; is_hidden?: boolean }>({
    mutationFn: async ({ questionId, is_pinned, is_hidden }) => {
      await qaFetch(`/api/protected/questions/${questionId}`, 'PATCH', { is_pinned, is_hidden });
    },
    onSuccess: invalidate,
  });
}

export function useAnswerQuestion(questionId: string) {
  const invalidate = useInvalidateQa();
  return useMutation<void, Error, string>({
    mutationFn: async (body) => {
      await qaFetch(`/api/protected/questions/${questionId}/answers`, 'POST', { body });
    },
    onSuccess: invalidate,
  });
}

/** Hide/unhide an own answer (author-only, enforced server-side). */
export function useToggleAnswerVisibility() {
  const invalidate = useInvalidateQa();
  return useMutation<void, Error, { answerId: string; is_hidden: boolean }>({
    mutationFn: async ({ answerId, is_hidden }) => {
      await qaFetch(`/api/protected/answers/${answerId}`, 'PATCH', { is_hidden });
    },
    onSuccess: invalidate,
  });
}

export function useDeleteAnswer() {
  const invalidate = useInvalidateQa();
  return useMutation<void, Error, string>({
    mutationFn: async (answerId) => {
      await qaFetch(`/api/protected/answers/${answerId}`, 'DELETE');
    },
    onSuccess: invalidate,
  });
}
