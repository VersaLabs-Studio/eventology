import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { signQRPayload } from '@/lib/tickets/qr';
import { mapTransferError } from '@/lib/tickets/transfer-errors';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/transfers/[id]/accept — a signed-in user whose EMAIL
 * matches a pending transfer completes it (HO-G). Same rotation mechanics as
 * the direct transfer: the route pre-signs the rotated payload, the fn
 * re-verifies recipient email, ticket validity, and expected version under
 * lock before reassigning ownership.
 *
 * Service-role READ justified: RLS (`tt_select_involved`) cannot express
 * "pending transfer addressed to MY email" — the recipient's to_profile is
 * NULL until completion, so the row is invisible to them. The fn is the
 * authorization (email match under lock); the read only assembles the
 * pre-signing inputs. All WRITES remain inside the SECURITY DEFINER fn.
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
      { error: { code: 'MISSING_PARAM', message: 'transfer id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const service = createServiceClient();

  const { data: transfer } = await service
    .from('ticket_transfers')
    .select('id, ticket_id, status, to_email')
    .eq('id', id)
    .maybeSingle();

  if (!transfer) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Transfer not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }
  const row = transfer as { id: string; ticket_id: string; status: string };
  if (row.status !== 'pending') {
    return NextResponse.json(
      { error: { code: 'NOT_PENDING', message: 'This transfer is no longer pending' } } satisfies ErrorEnvelope,
      { status: 409 }
    );
  }

  // Load the ticket to build the rotated HMAC input (version must match).
  const { data: ticket } = await service
    .from('tickets')
    .select('id, registration_id, qr_version')
    .eq('id', row.ticket_id)
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Ticket not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }
  const t = ticket as { id: string; registration_id: string; qr_version: number };

  const newVersion = (t.qr_version ?? 0) + 1;
  const newQrData = signQRPayload(t.id, t.registration_id, newVersion);

  const supabase = await createAuthedClient(session.user.id);
  const { data: accepted, error: fnError } = await supabase.rpc('fn_accept_transfer', {
    p_transfer: id,
    p_user: session.user.id,
    p_new_qr_data: newQrData,
    p_expected_version: t.qr_version ?? 0,
  });

  if (fnError) {
    return mapTransferError(fnError.message);
  }

  return NextResponse.json({ transfer_id: accepted, status: 'completed' });
}
