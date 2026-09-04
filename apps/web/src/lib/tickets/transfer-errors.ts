import { NextResponse } from 'next/server';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * Maps SECURITY DEFINER exception codes (044) to envelope responses.
 * Shared by the transfer / accept routes so the error vocabulary is uniform.
 */
export function mapTransferError(message: string): NextResponse {
  const code = message.trim();
  const map: Record<string, { status: number; code: string; message: string }> = {
    not_found: { status: 404, code: 'NOT_FOUND', message: 'Ticket or transfer not found' },
    not_owner: { status: 403, code: 'FORBIDDEN', message: 'You do not own this ticket' },
    invalid_ticket: { status: 400, code: 'INVALID_TICKET', message: 'Only valid (unused) tickets can be transferred' },
    event_started: { status: 409, code: 'EVENT_STARTED', message: 'This event has already started' },
    version_conflict: { status: 409, code: 'VERSION_CONFLICT', message: 'The ticket changed concurrently — please retry' },
    no_waitlist: { status: 409, code: 'NO_WAITLIST', message: 'No waitlisted attendees to release this ticket to' },
    self_transfer: { status: 400, code: 'SELF_TRANSFER', message: 'You cannot transfer a ticket to yourself' },
    not_pending: { status: 409, code: 'NOT_PENDING', message: 'This transfer is no longer pending' },
    not_recipient: { status: 403, code: 'FORBIDDEN', message: 'This transfer is addressed to a different email' },
    invalid_kind: { status: 400, code: 'VALIDATION_ERROR', message: 'Invalid transfer kind' },
  };
  const hit = map[code];
  if (hit) {
    return NextResponse.json(
      { error: { code: hit.code, message: hit.message } } satisfies ErrorEnvelope,
      { status: hit.status }
    );
  }
  return NextResponse.json(
    { error: { code: 'DB_ERROR', message } } satisfies ErrorEnvelope,
    { status: 500 }
  );
}
