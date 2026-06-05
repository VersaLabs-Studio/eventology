import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/registrations/[id]
 * Returns a single registration by ID.
 * RLS ensures only the owner or organizer can view.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing registration id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Use authenticated client so RLS resolves auth.uid() to the profile UUID
  const supabase = await createAuthedClient(session.user.id);

  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      event:events(id, title, slug, banner_image, start_date, end_date, venue_name),
      ticket_tier:ticket_tiers(id, name, price, currency),
      ticket:tickets(id, ticket_number, qr_data, tier_name, status, used_at)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Registration not found' } } satisfies ErrorEnvelope,
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * PUT /api/protected/registrations/[id]
 * Cancel a registration (owner only).
 * Uses authed client for cancel_registration RPC so auth.uid() resolves
 * inside the SECURITY DEFINER function (BLOCKER B fix).
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
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
      { error: { code: 'MISSING_PARAM', message: 'Missing registration id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Use authed client so auth.uid() resolves inside cancel_registration RPC.
  // The RPC is SECURITY DEFINER + GRANT EXECUTE TO authenticated, so the
  // authed client's JWT makes auth.uid() return the profile UUID.
  const supabase = await createAuthedClient(session.user.id);

  // First, verify the user owns this registration (via RLS — authed client)
  const { data: registration, error: fetchError } = await supabase
    .from('registrations')
    .select('id, user_id, status')
    .eq('id', id)
    .single();

  if (fetchError || !registration) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Registration not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  if (registration.user_id !== session.user.id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Not authorized to cancel this registration' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  if (registration.status === 'cancelled') {
    return NextResponse.json(
      { error: { code: 'ALREADY_CANCELLED', message: 'Registration is already cancelled' } } satisfies ErrorEnvelope,
      { status: 409 }
    );
  }

  // Call the cancel_registration RPC via authed client so auth.uid() resolves.
  // The RPC verifies ownership via auth.uid() internally.
  const { data: result, error: rpcError } = await supabase.rpc('cancel_registration', {
    p_registration_id: id,
  });

  if (rpcError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: rpcError.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const rpcResult = result as { success: boolean; error?: string; message?: string };

  if (!rpcResult.success) {
    return NextResponse.json(
      { error: { code: rpcResult.error ?? 'CANCEL_FAILED', message: rpcResult.message ?? 'Cancellation failed' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Fetch the updated registration to return
  const { data: updated, error: updateError } = await supabase
    .from('registrations')
    .select(`
      *,
      event:events(id, title, slug, banner_image, start_date, end_date, venue_name),
      ticket_tier:ticket_tiers(id, name, price, currency),
      ticket:tickets(id, ticket_number, qr_data, tier_name, status, used_at)
    `)
    .eq('id', id)
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: updateError.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(updated);
}
