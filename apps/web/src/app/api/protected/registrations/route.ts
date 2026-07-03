import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createRegistrationSchema, type RegistrationRPCResult } from '@eventology/schemas';
import { getPaymentProvider } from '@/lib/payments';
import { issueTicket } from '@/lib/tickets/issue-ticket';
import { resolveCommissionRate, splitCommission } from '@/lib/payments/commission';
import { notifyRegistrationConfirmed, notifyTicketIssued } from '@/lib/comms/domain-notify';
import { paymentsEnabledServer } from '@/lib/config/features';
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
    console.error(
      '[registrations] validation failed:',
      JSON.stringify(parsed.error.flatten().fieldErrors),
      '| received keys:', Object.keys((body ?? {}) as Record<string, unknown>)
    );
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
  // REV-003: Promo code is optional — extracted from body separately
  const promoCode = (body as { promo_code?: string }).promo_code?.trim() || null;

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

  // R3 / A1: When payments are disabled (MVP default), refuse paid
  // registrations outright. Free tiers are unaffected — the registration
  // proceeds on the free path below and the ticket is issued immediately.
  // This is the server-side mirror of the client gate in the register
  // page; both must agree to keep the seam honest.
  if (!paymentsEnabledServer() && tierCheck.price > 0) {
    return NextResponse.json(
      {
        error: {
          code: 'PAYMENTS_DISABLED',
          message: 'Paid tickets are not available right now. Please select a free tier.',
        },
      } satisfies ErrorEnvelope,
      { status: 503 }
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

  // AI-006: fire-and-forget fraud detection on registration creation.
  // Best-effort — the registration has already succeeded. An AI outage
  // NEVER blocks the user. Writes a fraud_signals row when suspicious.
  //
  // Rotation 1 / Day-14 audit debt: dispatch is positioned BEFORE the
  // free/paid path branching so that BOTH free and paid registrations
  // get a signal. Previously it sat below the paid-path `return`, so
  // paid registrations silently skipped fraud detection. The IIFE is
  // non-blocking and fail-open; the response to the caller does not
  // wait for the AI call.
  const registrationIdForSignal = result.registration?.id;
  void (async () => {
    try {
      const { aiDetectFraud } = await import('@/lib/ai/service');
      const { writeFraudSignal } = await import('@/lib/ai/persistence');
      const service = createServiceClient();
      const fraudResult = await aiDetectFraud({
        action_type: 'registration',
        user_id: session.user.id,
        metadata: {
          event_id,
          tier_id: ticket_tier_id,
          amount: tierCheck.price,
        },
      });
      if (
        fraudResult.ok &&
        fraudResult.data?.is_suspicious &&
        registrationIdForSignal
      ) {
        await writeFraudSignal(service, {
          subject_type: 'registration',
          subject_id: registrationIdForSignal,
          user_id: session.user.id,
          risk_score: fraudResult.data.risk_score,
          flags: fraudResult.data.flags,
          recommended_action: fraudResult.data.recommended_action,
          reason: fraudResult.data.reason ?? null,
          metadata: { event_id, tier_id: ticket_tier_id },
        });
      }
    } catch (err) {
      console.warn(
        '[AI/fraud] registration fire-and-forget failed:',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  })();

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

    // COMM-005: Fire best-effort notifications for the free path
    await notifyRegistrationConfirmed(serviceClient, result.registration.id);
    if (ticketResult.ticket) {
      await notifyTicketIssued(
        serviceClient,
        result.registration.id,
        ticketResult.ticket.ticket_number
      );
    }
  }

  // Paid path — create payment record and initiate payment
  if (result.registration?.status === 'pending_payment' && result.registration) {
    const provider = getPaymentProvider();

    if (tierCheck.price > 0) {
      // REV-002: Fetch the event's organizer commission rate override.
      // NULL → falls back to PLATFORM_COMMISSION_RATE inside the resolver.
      const { data: eventOrg } = await serviceClient
        .from('events')
        .select('organizer_id, organizers(commission_rate)')
        .eq('id', event_id)
        .single();

      // Type guard: organizers may be a relation (single object) or null
      const orgRelation = (eventOrg as unknown as {
        organizers?: { commission_rate?: number | null } | { commission_rate?: number | null }[] | null;
      })?.organizers;
      const organizerRate = Array.isArray(orgRelation)
        ? orgRelation[0]?.commission_rate ?? null
        : orgRelation?.commission_rate ?? null;

      const rate = resolveCommissionRate({ organizerRate });

      // REV-003: Apply promo code if provided. Uses atomic apply_promo_code RPC
      // (FOR UPDATE lock) to prevent concurrent double-spend.
      // FIN-3: capture redemption_id for compensation if the downstream
      // payment insert fails (release_promo_code RPC). The per-user cap
      // is enforced inside the locked RPC via promo_redemptions.
      let chargedPrice = tierCheck.price;
      let promoInfo: { id: string; code: string; discount_amount: number; redemption_id: string } | null = null;
      if (promoCode) {
        const { applyPromoCode, calculateDiscount } = await import('@/lib/payments/promo-codes');
        const applyResult = await applyPromoCode(supabase, promoCode, event_id, session.user.id);
        if (!applyResult.success) {
          return NextResponse.json(
            { error: { code: 'PROMO_INVALID', message: applyResult.error_message ?? 'Invalid promo code' } } satisfies ErrorEnvelope,
            { status: 400 }
          );
        }
        if (applyResult.discount_type && applyResult.discount_value !== undefined && applyResult.redemption_id) {
          const discountAmount = calculateDiscount(
            chargedPrice,
            applyResult.discount_type,
            applyResult.discount_value,
            applyResult.max_discount ?? null
          );
          chargedPrice = Math.round((chargedPrice - discountAmount) * 100) / 100;
          promoInfo = {
            id: applyResult.promo_id!,
            code: promoCode,
            discount_amount: discountAmount,
            redemption_id: applyResult.redemption_id,
          };
        }
      }

      // 2dp-correct split on the (possibly discounted) charged price
      const { platformFee, organizerAmount } = splitCommission(chargedPrice, rate);

      // Create payment record via service-role (system op — justified)
      const { data: payment, error: paymentError } = await serviceClient
        .from('payments')
        .insert({
          registration_id: result.registration.id,
          event_id: result.registration.event_id,
          user_id: result.registration.user_id,
          amount: chargedPrice,
          currency: tierCheck.currency,
          method: 'chapa', // Default method
          status: 'pending',
          platform_fee: platformFee,
          organizer_amount: organizerAmount,
        })
        .select()
        .single();

      // L5: If the payments insert fails, return 500 — don't fall through to a
      // 201 response with no checkout_url (which would leave the user in limbo).
      // FIN-3: also compensate the promo redemption (release_promo_code) so
      // used_count doesn't leak and the user can retry.
      if (paymentError || !payment) {
        if (promoInfo?.redemption_id) {
          try {
            await supabase.rpc('release_promo_code', {
              p_redemption_id: promoInfo.redemption_id,
            });
          } catch (compErr) {
            console.error('[Registration] Failed to release promo redemption on payment insert failure:', compErr);
          }
        }
        return NextResponse.json(
          { error: { code: 'PAYMENT_INSERT_FAILED', message: paymentError?.message ?? 'Failed to create payment record' } } satisfies ErrorEnvelope,
          { status: 500 }
        );
      }

      // FIN-3: Link the redemption row to the payment row so analytics
      // can trace promo usage back to its source payment.
      if (promoInfo?.redemption_id) {
        await supabase
          .from('promo_redemptions')
          .update({ payment_id: payment.id })
          .eq('id', promoInfo.redemption_id);
      }

      if (payment) {
        // Initiate payment with provider
        const initResult = await provider.initiate(
          result.registration.id,
          chargedPrice,
          tierCheck.currency,
          parsed.data.attendee_email
        );

        // L4: Use configured provider name instead of hardcoded 'stub'.
        const providerName = process.env.PAYMENT_PROVIDER ?? 'stub';

        // Update payment with provider reference and promo info
        await serviceClient
          .from('payments')
          .update({
            provider: providerName,
            provider_ref: initResult.referenceId,
            provider_metadata: {
              ...initResult.metadata,
              ...(promoInfo
                ? { promo_code: promoInfo.code, promo_id: promoInfo.id, discount_amount: promoInfo.discount_amount }
                : {}),
            },
          })
          .eq('id', payment.id);

        // Return checkout URL with promo info
        return NextResponse.json({
          ...result,
          checkout_url: initResult.checkoutUrl,
          ...(promoInfo ? { discount_applied: promoInfo.discount_amount, final_price: chargedPrice } : {}),
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
