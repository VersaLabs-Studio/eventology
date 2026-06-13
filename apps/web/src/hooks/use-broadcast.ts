'use client';

// ============================================================================
// Event Broadcast
// ============================================================================
// POST /api/protected/events/[id]/broadcast — organizer → attendees
// announcement. The route fans out best-effort via the comms seam.
// ============================================================================

import { useMutation } from '@tanstack/react-query';

interface BroadcastResult {
  success: boolean;
  conversation_id: string | null;
  delivered: number;
}

export function useBroadcast(eventId: string) {
  return useMutation({
    mutationFn: async (input: { subject: string; body: string }) => {
      const res = await fetch(`/api/protected/events/${eventId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Broadcast failed');
      }
      return res.json() as Promise<BroadcastResult>;
    },
  });
}
