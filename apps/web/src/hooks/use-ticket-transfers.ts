'use client';

// ============================================================================
// Ticket Transfers — Entity-Specific Hooks (HO-G)
// ============================================================================
// Transfer / accept / cancel — all mutations (SECURITY DEFINER fns behind
// the routes). Invalidates the ticket + registration caches too: a transfer
// MOVES a registration between users, so my-events / my-tickets must refresh.
// ============================================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TicketTransferKeys, TicketKeys, RegistrationKeys } from '@eventology/config';
import type { ErrorEnvelope } from '@/lib/api';

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function useInvalidateAfterTransfer() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: TicketTransferKeys.all() });
    queryClient.invalidateQueries({ queryKey: TicketKeys.all() });
    queryClient.invalidateQueries({ queryKey: RegistrationKeys.all() });
  };
}

/** Transfer by email, or release to the event's waitlist (face value only). */
export function useTransferTicket(ticketId: string) {
  const invalidate = useInvalidateAfterTransfer();
  return useMutation<
    { transfer_id: string; status: string },
    Error,
    { to_email?: string; kind?: 'transfer' | 'resale' }
  >({
    mutationFn: async (data) => {
      const res = await fetch(`/api/protected/tickets/${ticketId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Transfer failed');
      }
      return res.json();
    },
    onSuccess: invalidate,
  });
}

/** Complete a pending transfer addressed to my email. */
export function useAcceptTransfer() {
  const invalidate = useInvalidateAfterTransfer();
  return useMutation<{ transfer_id: string; status: string }, Error, string>({
    mutationFn: async (transferId) => {
      const res = await fetch(`/api/protected/transfers/${transferId}/accept`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Accept failed');
      }
      return res.json();
    },
    onSuccess: invalidate,
  });
}

/** Cancel my own pending transfer. */
export function useCancelTransfer() {
  const invalidate = useInvalidateAfterTransfer();
  return useMutation<void, Error, string>({
    mutationFn: async (transferId) => {
      const res = await fetch(`/api/protected/transfers/${transferId}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const body: Partial<ErrorEnvelope> = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Cancel failed');
      }
    },
    onSuccess: invalidate,
  });
}
