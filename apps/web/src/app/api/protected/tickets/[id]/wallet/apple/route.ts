import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { getWalletProvider } from '@eventology/wallet';
import { getOrIssuePass, toWalletTicket } from '@/lib/wallet/issue-pass';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/tickets/[id]/wallet/apple — returns the Apple Wallet
 * pass artifact (HO-H).
 *
 * Ownership via the authed client (RLS single read); issuance bookkeeping via
 * the service client (045 has no client write policy). The pass payload is
 * built by the WALLET_PROVIDER seam (V2.0: stub — no live keys). On transfer
 * (HO-G) the old pass is revoked by trigger; the new owner's request
 * reissues a fresh serial.
 */
export async function GET(
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
      { error: { code: 'MISSING_PARAM', message: 'Missing ticket id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const authed = await createAuthedClient(session.user.id);
  const { data: ticket, error } = await authed
    .from('tickets')
    .select(`
      id, ticket_number, tier_name, qr_data,
      event:events(id, title, start_date, venue_name),
      registration:registrations(id, attendee_name, attendee_email)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  if (!ticket) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Ticket not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  const service = createServiceClient();
  const pass = await getOrIssuePass(service, id, session.user.id, 'apple');
  if ('error' in pass) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: pass.error } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const artifact = await getWalletProvider().buildApplePass(
    toWalletTicket(ticket as unknown as Parameters<typeof toWalletTicket>[0], pass.serial)
  );

  return new NextResponse(Buffer.from(artifact.body), {
    status: 200,
    headers: {
      'Content-Type': artifact.contentType,
      'Content-Disposition': `attachment; filename="${artifact.filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
