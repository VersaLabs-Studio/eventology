import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { processRefund } from '@/lib/payments/refund';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/payments/[id]/refund
 * Organizer/admin-initiated full refund.
 *
 * Authorization: caller must be the event's organizer OR have admin role.
 * Body: { reason: string } (required)
 *
 * V1: full refund only. Partial refunds are V2.
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

  const { id: paymentId } = await params;

  let body: { reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  if (!body.reason || body.reason.trim().length < 3) {
    return NextResponse.json(
      { error: { code: 'MISSING_REASON', message: 'A refund reason of at least 3 characters is required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Service-role: cross-table writes (payments + tickets + registrations + tiers)
  // RLS can't express this orchestration. Justified.
  const serviceClient = createServiceClient();

  // Load the payment to find its event
  const { data: payment } = await serviceClient
    .from('payments')
    .select('event_id, events(organizer_id)')
    .eq('id', paymentId)
    .single();

  if (!payment) {
    return NextResponse.json(
      { error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  // App-level authorization: organizer of the event OR admin
  const authedClient = await createAuthedClient(session.user.id);
  const { data: profile } = await authedClient
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  // Type guard: events may be a relation
  const eventRel = (payment as unknown as {
    events?: { organizer_id?: string } | { organizer_id?: string }[] | null;
  })?.events;
  const eventOrganizerId = Array.isArray(eventRel)
    ? eventRel[0]?.organizer_id
    : eventRel?.organizer_id;

  // Check if the caller is the event's organizer (via profile → organizers)
  if (!isAdmin) {
    const { data: callerOrg } = await serviceClient
      .from('organizers')
      .select('id')
      .eq('profile_id', session.user.id)
      .maybeSingle();

    if (!callerOrg || callerOrg.id !== eventOrganizerId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only the event organizer or an admin can issue refunds' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }
  }

  // Process the refund (idempotent)
  const result = await processRefund(serviceClient, {
    paymentId,
    reason: body.reason.trim(),
    refundedBy: session.user.id,
  });

  if (!result.success) {
    const statusCode = result.error === 'PAYMENT_NOT_FOUND' ? 404
      : result.error === 'INVALID_STATUS' ? 400
      : result.error === 'PROVIDER_REFUND_FAILED' ? 502
      : 500;
    return NextResponse.json(
      { error: { code: result.error ?? 'REFUND_FAILED', message: result.message } } satisfies ErrorEnvelope,
      { status: statusCode }
    );
  }

  return NextResponse.json({ success: true, message: result.message });
}
