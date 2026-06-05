import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { issueTicket } from '@/lib/tickets/issue-ticket';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/payments/stub-callback
 * Simulates payment callback in dev mode.
 * Auto-confirms the payment and issues a ticket.
 * Requires authentication to prevent unauthorized ticket generation.
 *
 * FIX-006: Idempotent — skips if payment already completed.
 * Service-role justified: system ops (payment confirmation + ticket issuance)
 * require cross-table writes that RLS can't express.
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const { ref } = body as { ref?: string };
  if (!ref) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing reference' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  return handleStubCallback(ref, session.user.id);
}

/**
 * GET /api/protected/payments/stub-callback?ref=...
 * Handles the redirect from stub checkout URL.
 * The checkout URL is a GET-style querystring, so this handler makes the
 * demo flow navigable end-to-end (FIX-002 acceptance).
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const ref = searchParams.get('ref');
  if (!ref) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing reference' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  return handleStubCallback(ref, session.user.id);
}

/**
 * Shared handler for both GET and POST stub-callback.
 */
async function handleStubCallback(ref: string, userId: string) {
  // Service-role justified: system ops (payment confirmation + ticket issuance)
  // require cross-table writes that RLS can't express.
  const supabase = createServiceClient();

  // Find the payment by reference
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('provider_ref', ref)
    .single();

  if (paymentError || !payment) {
    return NextResponse.json(
      { error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  // Verify the payment belongs to the authenticated user
  if (payment.user_id !== userId) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Not authorized to confirm this payment' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  // FIX-006: Idempotency — if payment is already completed, return existing result
  if (payment.status === 'completed') {
    // Fetch the existing ticket
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id, ticket_number, qr_data, tier_name, status')
      .eq('registration_id', payment.registration_id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      message: 'Payment already confirmed',
      ticket: existingTicket ?? null,
    });
  }

  // Update payment status to completed
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      paid_at: new Date().toISOString(),
      provider: 'stub',
    })
    .eq('id', payment.id);

  if (updateError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: updateError.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Confirm the registration
  const { error: regError } = await supabase
    .from('registrations')
    .update({ status: 'confirmed' })
    .eq('id', payment.registration_id);

  if (regError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: regError.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Issue ticket with signed QR (idempotent — returns existing if already issued)
  const ticketResult = await issueTicket(payment.registration_id, supabase);

  if (!ticketResult.success) {
    return NextResponse.json(
      { error: { code: 'TICKET_ISSUANCE_FAILED', message: ticketResult.error ?? 'Failed to issue ticket' } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Payment confirmed and ticket issued',
    ticket: ticketResult.ticket,
  });
}
