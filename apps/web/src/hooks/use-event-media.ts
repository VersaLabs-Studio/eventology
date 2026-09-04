'use client';

// ============================================================================
// Event Media — Entity-Specific Hooks (HO-F)
// ============================================================================
// Read: GET /api/public/events/[slug]/media (RLS-scoped; session enhances
// with myReaction + viewer.isHost). Upload is a 2-step flow through the
// EXISTING upload seam: /api/protected/upload (bucket 'event-media') →
// POST /api/protected/events/[id]/media (metadata row). Mutations invalidate
// EventMediaKeys.all() (factory convention).
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EventMediaKeys } from '@eventology/config';
import type { ErrorEnvelope } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types (shaped to the public GET response)
// ---------------------------------------------------------------------------

export interface MediaItem {
  id: string;
  storage_path: string;
  caption: string | null;
  status: 'pending' | 'approved' | 'hidden';
  created_at: string;
  uploader_id: string;
  uploader: { id: string; full_name: string; avatar_url: string | null } | null;
  reaction_count: number;
  my_reaction: boolean;
}

export interface EventMediaResponse {
  data: MediaItem[];
  meta: { total: number; page: number; limit: number };
  viewer: { isHost: boolean };
}

// ---------------------------------------------------------------------------
// Read hook
// ---------------------------------------------------------------------------

export function useEventMedia(slug: string | null) {
  return useQuery<EventMediaResponse>({
    queryKey: EventMediaKeys.byEvent(slug ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/public/events/${slug}/media`);
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to load gallery');
      }
      return res.json();
    },
    enabled: !!slug,
  });
}

// ---------------------------------------------------------------------------
// Mutation plumbing
// ---------------------------------------------------------------------------

function useInvalidateMedia() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: EventMediaKeys.all() });
}

async function mediaFetch(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown) {
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

/**
 * Uploads one or more photos for an event. Each file goes through the
 * existing upload seam (image type + 5MB enforced there), then registers the
 * metadata row. The server attendee-gates the registration.
 */
export function useUploadMedia(eventId: string) {
  const invalidate = useInvalidateMedia();
  return useMutation<void, Error, { files: File[]; caption?: string }>({
    mutationFn: async ({ files, caption }) => {
      for (const file of files) {
        const form = new FormData();
        form.set('file', file);
        form.set('bucket', 'event-media');

        const upRes = await fetch('/api/protected/upload', { method: 'POST', body: form });
        if (!upRes.ok) {
          const body: Partial<ErrorEnvelope> = await upRes.json().catch(() => ({}));
          throw new Error(body.error?.message ?? 'Upload failed');
        }
        const { url } = (await upRes.json()) as { url: string };

        await mediaFetch(`/api/protected/events/${eventId}/media`, 'POST', {
          event_id: eventId,
          storage_path: url,
          caption: caption?.trim() ? caption.trim() : undefined,
        });
      }
    },
    onSuccess: invalidate,
  });
}

/** Caption edit (own) / moderation status (host-only, enforced server-side). */
export function useModerateMedia() {
  const invalidate = useInvalidateMedia();
  return useMutation<
    void,
    Error,
    { mediaId: string; caption?: string | null; status?: 'pending' | 'approved' | 'hidden' }
  >({
    mutationFn: async ({ mediaId, caption, status }) => {
      await mediaFetch(`/api/protected/media/${mediaId}`, 'PATCH', { caption, status });
    },
    onSuccess: invalidate,
  });
}

export function useDeleteMedia() {
  const invalidate = useInvalidateMedia();
  return useMutation<void, Error, string>({
    mutationFn: async (mediaId) => {
      await mediaFetch(`/api/protected/media/${mediaId}`, 'DELETE');
    },
    onSuccess: invalidate,
  });
}

export function useReactMedia() {
  const invalidate = useInvalidateMedia();
  return useMutation<void, Error, { mediaId: string; react: boolean }>({
    mutationFn: async ({ mediaId, react }) => {
      await mediaFetch(
        `/api/protected/media/${mediaId}/react`,
        react ? 'POST' : 'DELETE'
      );
    },
    onSuccess: invalidate,
  });
}
