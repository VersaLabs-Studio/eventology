import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createRegistrationSchema, type RegistrationRPCResult } from '@eventology/schemas';
import { getPaymentProvider } from '@/lib/payments';
import { issueTicket } from '@/lib/tickets/issue-ticket';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

/**
 * POST /api/protected/registrations
 * Creates a new registration with atomic capacity check.
 * Uses the create_registration_atomic DB function to prevent oversell.
 *
 * FIX-001: Calls issueTicket on the free/confirmed path.
 * FIX-003: App-level tier↔event guard (defense-in-depth).
 * FIX-004: RPC called via createAuthedClient so auth.uid() resolves.
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

  const parsed = createRegistrationSchema.safeParse(body);
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

  // Strip server-controlled fields
  const { event_id, ticket_tier_id, attendee_name, attendee_email, attendee_phone, metadata } = parsed.data;

  // FIX-003: App-level tier↔event guard (defense-in-depth; RPC also checks)
  const serviceClient = createServiceClient();
  const { data: tierCheck } = await serviceClient
    .from('ticket_tiers')
    .select('id, event_id, price, currency, name')
    .eq('id', ticket_tier_id)
    .single();

  if (!tierCheck) {
    return NextResponse.json(
      { error: { code: 'TIER_NOT_FOUND', message: 'Ticket tier not found' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  if (tierCheck.event_id !== event_id) {
    return NextResponse.json(
      { error: { code: 'TIER_EVENT_MISMATCH', message: 'Ticket tier does not belong to this event' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // FIX-004: Call RPC via authed client so auth.uid() resolves inside the function
  const supabase = await createAuthedClient(session.user.id);

  // Call the atomic registration function (no p_user_id — RPC derives from auth.uid())
  const { data, error } = await supabase.rpc('create_registration_atomic', {
    p_event_id: event_id,
    p_ticket_tier_id: ticket_tier_id,
    p_attendee_name: attendee_name,
    p_attendee_email: attendee_email,
    p_attendee_phone: attendee_phone ?? null,
    p_metadata: metadata ?? {},
  });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const result = data as RegistrationRPCResult;

  if (!result.success) {
    const statusCode = result.error === 'SOLD_OUT' ? 409 : result.error === 'ALREADY_REGISTERED' ? 409 : 400;
    return NextResponse.json(
      { error: { code: result.error ?? 'REGISTRATION_FAILED', message: result.message ?? 'Registration failed' } } satisfies ErrorEnvelope,
      { status: statusCode }
    );
  }

  // FIX-001: Free path — issue ticket immediately after confirmed registration
  if (result.registration?.status === 'confirmed' && result.registration) {
    const ticketResult = await issueTicket(result.registration.id, serviceClient);
    if (ticketResult.success && ticketResult.ticket) {
      result.ticket = ticketResult.ticket;
    }
    // If ticket issuance fails, log but don't fail the registration
    // The user is registered; ticket can be issued later
    if (!ticketResult.success) {
      console.error('[Registration] Failed to issue ticket for free registration:', ticketResult.error);
    }
  }

  // Paid path — create payment record and initiate payment
  if (result.registration?.status === 'pending_payment' && result.registration) {
    const provider = getPaymentProvider();

    if (tierCheck.price > 0) {
      // Create payment record via service-role (system op — justified)
      const { data: payment, error: paymentError } = await serviceClient
        .from('payments')
        .insert({
          registration_id: result.registration.id,
          event_id: result.registration.event_id,
          user_id: result.registration.user_id,
          amount: tierCheck.price,
          currency: tierCheck.currency,
          method: 'chapa', // Default method
          status: 'pending',
        })
        .select()
        .single();

      if (!paymentError && payment) {
        // Initiate payment with provider
        const initResult = await provider.initiate(
          result.registration.id,
          tierCheck.price,
          tierCheck.currency,
          parsed.data.attendee_email
        );

        // Update payment with provider reference
        await serviceClient
          .from('payments')
          .update({
            provider: 'stub',
            provider_ref: initResult.referenceId,
            provider_metadata: initResult.metadata,
          })
          .eq('id', payment.id);

        // Return checkout URL
        return NextResponse.json({
          ...result,
          checkout_url: initResult.checkoutUrl,
        }, { status: 201 });
      }
    }
  }

  return NextResponse.json(result, { status: 201 });
}

/**
 * GET /api/protected/registrations
 * Returns the current user's registrations.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  // Use authenticated client so RLS resolves auth.uid() to the profile UUID
  const supabase = await createAuthedClient(session.user.id);

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const status = searchParams.get('status')?.trim() ?? '';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('registrations')
    .select(`
      *,
      event:events(id, title, slug, banner_image, start_date, end_date, venue_name),
      ticket_tier:ticket_tiers(id, name, price, currency)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Status filter
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { total: count ?? 0, page, limit },
  } satisfies ListEnvelope<unknown>);
}
