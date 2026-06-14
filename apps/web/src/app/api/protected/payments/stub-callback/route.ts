import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { confirmPayment } from '@/lib/payments/confirm-payment';
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
 * Delegates to the shared confirmPayment helper.
 */
async function handleStubCallback(ref: string, userId: string) {
  // Service-role justified: system ops (payment confirmation + ticket issuance)
  // require cross-table writes that RLS can't express.
  const supabase = createServiceClient();

  const result = await confirmPayment(ref, supabase, { userId });

  if (!result.success) {
    const statusCode = result.error === 'PAYMENT_NOT_FOUND' ? 404
      : result.error === 'FORBIDDEN' ? 403
      : 500;

    return NextResponse.json(
      { error: { code: result.error ?? 'CONFIRM_FAILED', message: result.message } } satisfies ErrorEnvelope,
      { status: statusCode }
    );
  }

  return NextResponse.json({
    success: true,
    message: result.message,
    ticket: result.ticket ?? null,
  });
}
