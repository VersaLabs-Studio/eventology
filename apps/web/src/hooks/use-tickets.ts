'use client';

// ============================================================================
// Tickets — Entity-Specific Hooks
// ============================================================================
// Thin wrappers around the generic factory hooks, specialized for Tickets.
// Provides my-tickets lookup and check-in mutation.
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TicketKeys } from '@eventology/config';
import { useDoc } from '@/hooks/factory';
import type { ListOptions, ListResponse } from '@/hooks/factory';
import type { Tables } from '@eventology/schemas';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TicketRow = Tables<'tickets'>;

export interface TicketWithRelations extends TicketRow {
  event?: {
    id: string;
    title: string;
    slug: string;
    banner_image: string | null;
    start_date: string;
    end_date: string;
    venue_name: string | null;
  };
  registration?: {
    id: string;
    attendee_name: string;
    attendee_email: string;
    ticket_tier_id: string;
    checked_in_at: string | null;
  };
}

// ---------------------------------------------------------------------------
// List hook — returns my tickets with joined relations
// ---------------------------------------------------------------------------

export function useMyTickets(options?: ListOptions) {
  return useQuery<ListResponse<TicketWithRelations>>({
    queryKey: TicketKeys.list(options),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', String(options.page));
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.status) params.set('status', options.status);

      const url = params.toString()
        ? `/api/protected/tickets?${params}`
        : '/api/protected/tickets';

      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? 'Failed to fetch tickets'
        );
      }

      return res.json();
    },
  });
}

// ---------------------------------------------------------------------------
// Single document hook
// ---------------------------------------------------------------------------

export function useTicket(id: string | null) {
  return useDoc<TicketWithRelations>('tickets', id, true);
}

// ---------------------------------------------------------------------------
// Check-in mutation
// ---------------------------------------------------------------------------

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; ticket: { id: string; ticket_number: string; tier_name: string; status: string } },
    Error,
    { qr_data: string }
  >({
    mutationFn: async ({ qr_data }) => {
      const res = await fetch('/api/protected/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_data }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? 'Check-in failed'
        );
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TicketKeys.all() });
    },
  });
}
