'use client';

// ============================================================================
// Activity Feed — Entity-Specific Hooks (HO-A)
// ============================================================================
// Infinite feed over GET /api/protected/feed (materialized `feed_activities`
// read, RLS-scoped to followed actors). Follow mutations invalidate FeedKeys.
// ============================================================================

import { useInfiniteQuery } from '@tanstack/react-query';
import { FeedKeys } from '@eventology/config';
import type { FeedItem } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

interface FeedPage {
  data: FeedItem[];
  meta: { total: number; page: number; limit: number };
}

export function useFeed(options?: { limit?: number }) {
  const limit = options?.limit ?? 20;

  return useInfiniteQuery<FeedPage, Error>({
    queryKey: FeedKeys.list({ limit }),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set('page', String(pageParam));
      params.set('limit', String(limit));

      const res = await fetch(`/api/protected/feed?${params}`);
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to load feed');
      }
      return res.json() as Promise<FeedPage>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.meta.page + 1;
      const hasMore = lastPage.data.length > 0 && lastPage.meta.total > lastPage.meta.page * lastPage.meta.limit;
      return hasMore ? nextPage : undefined;
    },
  });
}
