'use client';

// ============================================================================
// User Follows — Entity-Specific Hooks (HO-A Social Graph)
// ============================================================================
// Optimistic follow/unfollow against /api/protected/users/[userId]/follow.
// Cache invalidation covers the follow graph AND the feed (a new follow can
// unlock previously-invisible feed rows via the RLS follow-join).
// ============================================================================

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { UserFollowKeys, FeedKeys } from '@eventology/config';
import type { ErrorEnvelope } from '@/lib/api';

async function followRequest(userId: string, method: 'POST' | 'DELETE') {
  const res = await fetch(`/api/protected/users/${userId}/follow`, {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
    body: method === 'POST' ? JSON.stringify({ following_id: userId }) : undefined,
  });

  if (!res.ok && res.status !== 204) {
    const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
    throw new Error(body.error?.message ?? 'Failed to update follow');
  }
  return res;
}

/** Snapshot of social-count caches captured for optimistic rollback. */
interface FollowMutationContext {
  previous: Array<[QueryKey, { followers: number; following: number } | undefined]>;
}

/**
 * Follow a user. Optimistic: the UI flips immediately; a failed request
 * rolls back. Idempotent server-side (23505 → 200).
 */
export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, FollowMutationContext>({
    mutationFn: async (userId) => {
      await followRequest(userId, 'POST');
    },
    onMutate: async (userId) => {
      // Optimistically mark the user as followed in any social-count caches.
      await queryClient.cancelQueries({ queryKey: UserFollowKeys.all() });
      const previous = queryClient.getQueriesData<{ followers: number; following: number }>({
        queryKey: UserFollowKeys.all(),
      });
      queryClient.setQueriesData<{ followers: number; following: number }>(
        { queryKey: UserFollowKeys.all() },
        (social) =>
          social
            ? { ...social, following: social.following + 1 }
            : social
      );
      return { previous };
    },
    onError: (_err, _userId, context) => {
      context?.previous.forEach(([key, value]) => queryClient.setQueryData(key, value));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: UserFollowKeys.all() });
      queryClient.invalidateQueries({ queryKey: FeedKeys.all() });
    },
  });
}

/**
 * Unfollow a user. Optimistic with rollback, same invalidation surface.
 */
export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, FollowMutationContext>({
    mutationFn: async (userId) => {
      await followRequest(userId, 'DELETE');
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: UserFollowKeys.all() });
      const previous = queryClient.getQueriesData<{ followers: number; following: number }>({
        queryKey: UserFollowKeys.all(),
      });
      queryClient.setQueriesData<{ followers: number; following: number }>(
        { queryKey: UserFollowKeys.all() },
        (social) =>
          social
            ? { ...social, following: Math.max(0, social.following - 1) }
            : social
      );
      return { previous };
    },
    onError: (_err, _userId, context) => {
      context?.previous.forEach(([key, value]) => queryClient.setQueryData(key, value));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: UserFollowKeys.all() });
      queryClient.invalidateQueries({ queryKey: FeedKeys.all() });
    },
  });
}
