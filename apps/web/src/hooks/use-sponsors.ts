'use client';

// ============================================================================
// Sponsors — Entity-Specific Hooks
// ============================================================================
// Thin wrapper for the /api/protected/sponsors route. The list requires
// an event_id query (RLS self-enforces ownership on the server).
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SponsorKeys } from '@eventology/config';
import type { SponsorRow } from '@/app/api/protected/sponsors/route';

export type { SponsorRow };

interface SponsorsResponse {
  data: SponsorRow[];
  meta: { total: number; page: number; limit: number };
}

export function useSponsors(eventId: string | null) {
  return useQuery<SponsorsResponse>({
    queryKey: [...SponsorKeys.byEvent(eventId ?? ''), 'manage'] as const,
    queryFn: async () => {
      const res = await fetch(`/api/protected/sponsors?event_id=${encodeURIComponent(eventId!)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to fetch sponsors');
      }
      return res.json();
    },
    enabled: !!eventId,
  });
}

export type SponsorInput = Omit<SponsorRow, 'id' | 'created_at' | 'updated_at' | 'metadata'> & {
  metadata?: Record<string, unknown>;
};

export function useCreateSponsor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SponsorInput & { event_id: string }) => {
      const res = await fetch('/api/protected/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to create sponsor');
      }
      return res.json() as Promise<SponsorRow>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SponsorKeys.all() });
    },
  });
}

export function useUpdateSponsor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SponsorInput> }) => {
      const res = await fetch(`/api/protected/sponsors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to update sponsor');
      }
      return res.json() as Promise<SponsorRow>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SponsorKeys.all() });
    },
  });
}

export function useDeleteSponsor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/protected/sponsors/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to delete sponsor');
      }
      return { success: true } as const;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SponsorKeys.all() });
    },
  });
}
