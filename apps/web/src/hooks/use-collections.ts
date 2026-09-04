'use client';

// ============================================================================
// Collections — Entity-Specific Hooks (HO-C)
// ============================================================================
// My-lists management (protected) + public collection/featured reads.
// Every mutation invalidates CollectionKeys.all() (factory convention).
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CollectionKeys } from '@eventology/config';
import type {
  CollectionFormData,
  UpdateCollectionData,
  CollectionVisibility,
} from '@eventology/schemas';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A "My List" row as served by the protected endpoint (event_count flattened). */
export interface MyCollection {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  cover_url: string | null;
  is_editorial: boolean;
  is_featured: boolean;
  visibility: CollectionVisibility;
  event_count: number;
  created_at: string;
  updated_at: string;
}

/** Public collection payload (owner joined, ordered event cards). */
export interface PublicCollection {
  collection: {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    cover_url: string | null;
    is_editorial: boolean;
    is_featured: boolean;
    visibility: CollectionVisibility;
    event_count: number;
    owner?: { id: string; full_name: string; avatar_url: string | null } | null;
    updated_at: string;
  };
  // Raw joined event rows — caller runs them through transformEvent.
  events: unknown[];
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function useMyCollections() {
  return useQuery<ListEnvelope<MyCollection>>({
    queryKey: CollectionKeys.mine(),
    queryFn: async () => {
      const res = await fetch('/api/protected/collections');
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to load lists');
      }
      return res.json();
    },
  });
}

export function useCollectionBySlug(slug: string | null) {
  return useQuery<PublicCollection>({
    queryKey: CollectionKeys.bySlug(slug ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/public/collections/${slug}`);
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Collection not found');
      }
      return res.json();
    },
    enabled: !!slug,
  });
}

export interface FeaturedCollection {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  cover_url: string | null;
  event_count: number;
  owner?: { full_name: string } | null;
}

export function useFeaturedCollections(limit = 6) {
  return useQuery<{ data: FeaturedCollection[] }>({
    queryKey: CollectionKeys.featured(),
    queryFn: async () => {
      const res = await fetch(`/api/public/collections/featured?limit=${limit}`);
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to load featured collections');
      }
      return res.json();
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function useInvalidateCollections() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CollectionKeys.all() });
}

export function useCreateCollection() {
  const invalidate = useInvalidateCollections();
  return useMutation<MyCollection, Error, CollectionFormData>({
    mutationFn: async (data) => {
      const res = await fetch('/api/protected/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to create list');
      }
      return res.json();
    },
    onSuccess: invalidate,
  });
}

export function useUpdateCollection() {
  const invalidate = useInvalidateCollections();
  return useMutation<MyCollection, Error, { id: string; data: UpdateCollectionData }>({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`/api/protected/collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to update list');
      }
      return res.json();
    },
    onSuccess: invalidate,
  });
}

export function useDeleteCollection() {
  const invalidate = useInvalidateCollections();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/protected/collections/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to delete list');
      }
    },
    onSuccess: invalidate,
  });
}

/** Adds an event to a list. Server is idempotent (23505 → 200 already). */
export function useAddToList() {
  const invalidate = useInvalidateCollections();
  return useMutation<
    { ok?: boolean; already?: boolean },
    Error,
    { collectionId: string; eventId: string }
  >({
    mutationFn: async ({ collectionId, eventId }) => {
      const res = await fetch(`/api/protected/collections/${collectionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      });
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to add to list');
      }
      return res.json();
    },
    onSuccess: invalidate,
  });
}

export function useRemoveFromList() {
  const invalidate = useInvalidateCollections();
  return useMutation<void, Error, { collectionId: string; eventId: string }>({
    mutationFn: async ({ collectionId, eventId }) => {
      const res = await fetch(
        `/api/protected/collections/${collectionId}/items?eventId=${eventId}`,
        { method: 'DELETE' }
      );
      if (!res.ok && res.status !== 204) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to remove from list');
      }
    },
    onSuccess: invalidate,
  });
}
