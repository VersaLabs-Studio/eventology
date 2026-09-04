import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { signQRPayload } from '@/lib/tickets/qr';
import { mapTransferError } from '@/lib/tickets/transfer-errors';
import { transferTicketSchema } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/tickets/[id]/transfer — transfer or resale (HO-G).
 *
 * Flow (all server-side; the HMAC secret never touches the client or DB):
 *   1. Load the ticket (RLS own-read) → fail fast on ownership/status/start.
 *   2. PRE-SIGN the rotated payload with the server util:
 *      signQRPayload(ticketId, registrationId, qr_version + 1). All HMAC
 *      inputs are known before the fn runs.
 *   3. fn_transfer_ticket re-verifies EVERYTHING under lock (owner, status
 *      'valid', event not started, expected version) and — only then —
 *      reassigns ownership, stores the new payload, bumps the version, and
 *      writes the audit row. The OLD QR dies at commit (check-in compares
 *      the scanned version against tickets.qr_version).
 *
 * kind='resale' hands the ticket to the NEXT WAITLISTED registration (face
 * value only — no P2P pricing, no payment-seam changes).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'ticket id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const parsed = transferTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parsed.error.flatten(),
        },
      } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const kind = parsed.data.kind ?? 'transfer';
  if (kind === 'transfer' && !parsed.data.to_email) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'to_email is required for a direct transfer' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  // RLS own-read → fast-fail before the fn (the fn re-verifies under lock).
  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, registration_id, user_id, status, qr_version, event:events(start_date)')
    .eq('id', id)
    .maybeSingle();

  if (!ticket || (ticket as { user_id: string }).user_id !== session.user.id) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Ticket not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  const row = ticket as {
    id: string;
    registration_id: string;
    user_id: string;
    status: string;
    qr_version: number;
    event: { start_date: string } | { start_date: string }[] | null;
  };

  const eventRel = Array.isArray(row.event) ? row.event[0] : row.event;
  if (row.status !== 'valid') {
    return NextResponse.json(
      { error: { code: 'INVALID_TICKET', message: 'Only valid (unused) tickets can be transferred' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }
  if (!eventRel || new Date(eventRel.start_date) <= new Date()) {
    return NextResponse.json(
      { error: { code: 'EVENT_STARTED', message: 'This event has already started' } } satisfies ErrorEnvelope,
      { status: 409 }
    );
  }

  // Pre-sign the rotated payload for version + 1 (server util — never client).
  const newVersion = (row.qr_version ?? 0) + 1;
  const newQrData = signQRPayload(row.id, row.registration_id, newVersion);

  const { data: transferId, error: fnError } = await supabase.rpc('fn_transfer_ticket', {
    p_ticket: id,
    p_to_email: parsed.data.to_email ?? '',
    p_kind: kind,
    p_new_qr_data: newQrData,
    p_expected_version: row.qr_version ?? 0,
  });

  if (fnError) {
    return mapTransferError(fnError.message);
  }

  return NextResponse.json({
    transfer_id: transferId,
    status: kind === 'resale' ? 'completed' : 'completed_or_pending',
  });
}
