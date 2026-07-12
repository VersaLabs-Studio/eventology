'use client';

// ============================================================================
// Admin Events — Hooks
// ============================================================================
// Admin-scoped event listing + detail. Uses the protected admin endpoints
// (service-role backed) so admins can read any event regardless of owner.
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import type { AdminEventRow, AdminEventsMeta } from '@/app/api/protected/admin/events/route';
import type { AdminEventDetail } from '@/app/api/protected/admin/events/[id]/route';

export type { AdminEventRow, AdminEventDetail, AdminEventsMeta };

interface AdminEventsResponse {
  data: AdminEventRow[];
  meta: AdminEventsMeta;
}

export function useAdminEvents(options?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<AdminEventsResponse>({
    queryKey: ['admin', 'events', 'list', options ?? {}],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.search) params.set('search', options.search);
      if (options?.status) params.set('status', options.status);
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      const res = await fetch(`/api/protected/admin/events?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? 'Failed to load events'
        );
      }
      return res.json();
    },
  });
}

export function useAdminEvent(id: string | null) {
  return useQuery<AdminEventDetail>({
    queryKey: ['admin', 'events', 'doc', id],
    queryFn: async () => {
      const res = await fetch(`/api/protected/admin/events/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? 'Event not found'
        );
      }
      return res.json();
    },
    enabled: !!id,
  });
}
