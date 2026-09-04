import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { getWalletProvider } from '@eventology/wallet';
import { getOrIssuePass, toWalletTicket } from '@/lib/wallet/issue-pass';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/tickets/[id]/wallet/google — returns the Google Wallet
 * save URL (HO-H). Same ownership + issuance semantics as the Apple route;
 * the URL comes from the WALLET_PROVIDER seam (V2.0: stub — no live keys).
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
  const pass = await getOrIssuePass(service, id, session.user.id, 'google');
  if ('error' in pass) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: pass.error } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const link = await getWalletProvider().buildGoogleSaveUrl(
    toWalletTicket(ticket as unknown as Parameters<typeof toWalletTicket>[0], pass.serial)
  );

  return NextResponse.json(link, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
