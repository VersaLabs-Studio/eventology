import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createPromoCodeSchema, updatePromoCodeSchema } from '@eventology/schemas';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

/**
 * GET /api/protected/promo-codes
 * List promo codes scoped to the current organizer's events.
 * Query params: event_id (optional filter)
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
  const eventId = searchParams.get('event_id');

  let query = supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (eventId) {
    query = query.eq('event_id', eventId);
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
 * POST /api/protected/promo-codes
 * Create a new promo code for one of the organizer's events.
 * Body: { event_id, code, discount_type, discount_value, ... }
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

  // Inject organizer_id server-side from the session
  const serviceClient = createServiceClient();
  const { data: organizer } = await serviceClient
    .from('organizers')
    .select('id')
    .eq('profile_id', session.user.id)
    .maybeSingle();

  if (!organizer) {
    return NextResponse.json(
      { error: { code: 'NOT_ORGANIZER', message: 'Only organizers can create promo codes' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  const parsed = createPromoCodeSchema.safeParse({
    ...(body as Record<string, unknown>),
    organizer_id: organizer.id,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid promo code data', details: parsed.error.flatten() } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { data, error } = await supabase
    .from('promo_codes')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    const statusCode = error.code === '23505' ? 409 : 500;
    return NextResponse.json(
      { error: { code: error.code ?? 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: statusCode }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * PATCH /api/protected/promo-codes
 * Update an existing promo code (toggle is_active, adjust limits, etc).
 * Body: { id, ...updates }
 */
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  let body: { id?: string } & Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  if (!body.id) {
    return NextResponse.json(
      { error: { code: 'MISSING_ID', message: 'Promo code id is required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const { id, ...rest } = body;
  const parsed = updatePromoCodeSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid update data', details: parsed.error.flatten() } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { data, error } = await supabase
    .from('promo_codes')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
