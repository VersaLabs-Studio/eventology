'use client';

// ============================================================================
// Reviews — Entity-Specific Hooks
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReviewKeys, EventKeys } from '@eventology/config';
import { useDoc } from '@/hooks/factory';
import type { ListResponse } from '@/hooks/factory';
import type { Tables } from '@eventology/schemas';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewRow = Tables<'reviews'>;

export interface ReviewAggregate {
  average: number;
  count: number;
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
}

export interface EventReviewsResponse {
  data: ReviewRow[];
  meta: { total: number; page: number; limit: number };
  aggregate: ReviewAggregate;
}

export interface CreateReviewInput {
  event_id: string;
  rating: number;
  title?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  content?: string;
}

// ---------------------------------------------------------------------------
// Public: event reviews (approved only) + aggregate
// ---------------------------------------------------------------------------

export function useEventReviews(slug: string | null, page = 1, limit = 10) {
  return useQuery<EventReviewsResponse>({
    queryKey: ['reviews', 'event', slug, { page, limit }],
    queryFn: async () => {
      const res = await fetch(`/api/public/events/${slug}/reviews?page=${page}&limit=${limit}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? 'Failed to fetch reviews'
        );
      }
      return res.json();
    },
    enabled: !!slug,
  });
}

// ---------------------------------------------------------------------------
// Single document hook
// ---------------------------------------------------------------------------

export function useReview(id: string | null) {
  return useDoc<ReviewRow>('reviews', id);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation<ReviewRow, Error, CreateReviewInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/protected/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = body as { error?: { code?: string; message?: string } };
        const error = new Error(err.error?.message ?? 'Failed to submit review') as Error & { code?: string; status?: number };
        error.code = err.error?.code;
        error.status = res.status;
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation<ReviewRow, Error, { id: string } & UpdateReviewInput>({
    mutationFn: async ({ id, ...input }) => {
      const res = await fetch(`/api/protected/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? 'Failed to update review'
        );
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Admin: moderate reviews
// ---------------------------------------------------------------------------

export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation<ReviewRow, Error, { id: string; is_approved?: boolean; is_flagged?: boolean; flag_reason?: string | null }>({
    mutationFn: async (input) => {
      const res = await fetch('/api/protected/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? 'Failed to moderate review'
        );
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

export function useAdminReviews(status?: 'pending' | 'approved' | 'flagged', page = 1, limit = 20) {
  return useQuery<{ data: (ReviewRow & { event?: { id: string; title: string; slug: string } })[]; meta: { total: number; page: number; limit: number } }>({
    queryKey: ['reviews', 'admin', status, { page, limit }],
    queryFn: async () => {
      const url = new URL('/api/protected/admin/reviews', window.location.origin);
      if (status) url.searchParams.set('status', status);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));
      
      const res = await fetch(url.toString());
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? 'Failed to fetch admin reviews'
        );
      }
      return res.json();
    },
  });
}
