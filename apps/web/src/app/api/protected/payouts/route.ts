import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { requestPayout, computeOrganizerBalance } from '@/lib/payments/payouts';
import { getPaymentProvider } from '@/lib/payments';
import { z } from 'zod';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

const createPayoutRequestSchema = z.object({
  amount: z.number().positive(),
  event_id: z.string().uuid().nullable().optional(),
  bank_account: z.record(z.string(), z.unknown()).default({}),
});

/**
 * GET /api/protected/payouts
 * List payouts for the current organizer's events.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  // Get the organizer's id from their profile
  const { data: organizer } = await supabase
    .from('organizers')
    .select('id')
    .eq('profile_id', session.user.id)
    .maybeSingle();

  if (!organizer) {
    return NextResponse.json({ data: [], meta: { total: 0, page: 1, limit: 0 } } satisfies ListEnvelope<unknown>);
  }

  let query = supabase
    .from('payouts')
    .select('*')
    .eq('organizer_id', organizer.id)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { total: data?.length ?? 0, page: 1, limit: data?.length ?? 0 },
  } satisfies ListEnvelope<unknown>);
}

/**
 * POST /api/protected/payouts
 * Request a new payout. Body: { amount, event_id?, bank_account }
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
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

  const parsed = createPayoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid payout data', details: parsed.error.flatten() } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Find the organizer's id
  const serviceClient = createServiceClient();
  const { data: organizer } = await serviceClient
    .from('organizers')
    .select('id')
    .eq('profile_id', session.user.id)
    .maybeSingle();

  if (!organizer) {
    return NextResponse.json(
      { error: { code: 'NOT_ORGANIZER', message: 'Only organizers can request payouts' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  const result = await requestPayout(
    serviceClient,
    organizer.id,
    parsed.data.amount,
    parsed.data.event_id ?? null,
    parsed.data.bank_account
  );

  if (!result.success) {
    const statusCode = result.error === 'INSUFFICIENT_BALANCE' ? 400
      : result.error === 'INVALID_AMOUNT' ? 400
      : 500;
    return NextResponse.json(
      { error: { code: result.error ?? 'PAYOUT_FAILED', message: result.message } } satisfies ErrorEnvelope,
      { status: statusCode }
    );
  }

  // Return the created payout with computed balance for the UI
  const balance = await computeOrganizerBalance(serviceClient, organizer.id);

  return NextResponse.json({
    success: true,
    message: result.message,
    payout_id: result.payoutId,
    balance,
    provider_note: getPaymentProvider().constructor.name,
  }, { status: 201 });
}
