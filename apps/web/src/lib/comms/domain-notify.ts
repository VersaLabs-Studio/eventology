// ============================================================================
// Domain Notify Helpers
// ============================================================================
// Thin wrapper around notify() that resolves the data needed to render
// a template (event title, venue, date, user name, ticket URL) and
// passes it through. Domain flows call these — they never call
// notify() directly with the full input shape.
//
// Best-effort: never throws. Failures are logged but never propagate
// up to the calling financial/registration flow.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { notify, loadUserAddress, loadUserPrefs } from './notify';
import type { NotifyInput, TemplateInputs } from './notify';

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/**
 * Resolves the context (event, registration, ticket) for a registration
 * so we can render templates without the caller having to look everything up.
 */
async function resolveRegistrationContext(
  supabase: SupabaseClient,
  registrationId: string
): Promise<{
  userId: string;
  attendeeName: string;
  event: { id: string; title: string; venue: string; startDate: string };
  ticket: { ticketNumber: string } | null;
} | null> {
  const { data: reg } = await supabase
    .from('registrations')
    .select(`
      id, user_id, attendee_name,
      event:events(id, title, venue_name, start_date),
      ticket:tickets(ticket_number, status)
    `)
    .eq('id', registrationId)
    .maybeSingle();

  if (!reg) return null;

  const event = Array.isArray(reg.event) ? reg.event[0] : reg.event;
  const ticket = Array.isArray(reg.ticket) ? reg.ticket[0] : reg.ticket;

  if (!event) return null;

  return {
    userId: reg.user_id,
    attendeeName: reg.attendee_name,
    event: {
      id: event.id,
      title: event.title,
      venue: event.venue_name ?? 'TBD',
      startDate: event.start_date,
    },
    ticket: ticket && ticket.status !== 'cancelled'
      ? { ticketNumber: ticket.ticket_number }
      : null,
  };
}

/**
 * Notify on registration confirmation. Fire-and-forget — never throws.
 */
export async function notifyRegistrationConfirmed(
  supabase: SupabaseClient,
  registrationId: string
): Promise<void> {
  try {
    const ctx = await resolveRegistrationContext(supabase, registrationId);
    if (!ctx) return;

    const prefs = await loadUserPrefs(supabase, ctx.userId);
    const address = await loadUserAddress(supabase, ctx.userId);

    const ticketNumber = ctx.ticket?.ticketNumber ?? 'TKT-PENDING';
    const ticketUrl = `${APP_BASE_URL}/my-tickets?reg=${registrationId}`;

    const templateInput: TemplateInputs = {
      kind: 'registration_confirmed',
      data: {
        name: ctx.attendeeName,
        event: ctx.event.title,
        eventDate: new Date(ctx.event.startDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        venue: ctx.event.venue,
        ticketNumber,
        ticketUrl,
      },
    };

    const input: NotifyInput = {
      userId: ctx.userId,
      type: 'registration_confirmed',
      referenceType: 'registration',
      referenceId: registrationId,
      actionUrl: ticketUrl,
      address,
      channelPrefs: prefs.channelPrefs,
      locale: prefs.locale,
      templateInput,
    };

    await notify(supabase, input);
  } catch (err) {
    console.error('[notifyRegistrationConfirmed] best-effort failure:', err);
  }
}

/**
 * Notify on ticket issuance. Used by the free-path ticket issuance and
 * the paid path after confirmPayment. Best-effort.
 */
export async function notifyTicketIssued(
  supabase: SupabaseClient,
  registrationId: string,
  ticketNumber: string,
  ticketUrl?: string
): Promise<void> {
  try {
    const ctx = await resolveRegistrationContext(supabase, registrationId);
    if (!ctx) return;

    const prefs = await loadUserPrefs(supabase, ctx.userId);
    const address = await loadUserAddress(supabase, ctx.userId);

    const templateInput: TemplateInputs = {
      kind: 'ticket_issued',
      data: {
        name: ctx.attendeeName,
        event: ctx.event.title,
        ticketNumber,
        ticketUrl: ticketUrl ?? `${APP_BASE_URL}/my-tickets?reg=${registrationId}`,
      },
    };

    const input: NotifyInput = {
      userId: ctx.userId,
      type: 'payment_completed',
      referenceType: 'registration',
      referenceId: registrationId,
      actionUrl: ticketUrl,
      address,
      channelPrefs: prefs.channelPrefs,
      locale: prefs.locale,
      templateInput,
    };

    await notify(supabase, input);
  } catch (err) {
    console.error('[notifyTicketIssued] best-effort failure:', err);
  }
}

/**
 * Notify on payment completion (post-confirm). Best-effort.
 */
export async function notifyPaymentCompleted(
  supabase: SupabaseClient,
  paymentId: string
): Promise<void> {
  try {
    const { data: payment } = await supabase
      .from('payments')
      .select(`
        id, amount, currency, registration_id,
        event:events(id, title, start_date)
      `)
      .eq('id', paymentId)
      .maybeSingle();

    if (!payment) return;

    const event = Array.isArray(payment.event) ? payment.event[0] : payment.event;
    if (!event) return;

    // Get the attendee name from the registration
    const { data: reg } = await supabase
      .from('registrations')
      .select('user_id, attendee_name')
      .eq('id', payment.registration_id)
      .maybeSingle();

    if (!reg) return;

    const prefs = await loadUserPrefs(supabase, reg.user_id);
    const address = await loadUserAddress(supabase, reg.user_id);

    const receiptUrl = `${APP_BASE_URL}/my-tickets?reg=${payment.registration_id}`;

    const templateInput: TemplateInputs = {
      kind: 'payment_completed',
      data: {
        name: reg.attendee_name,
        event: event.title,
        amount: String(payment.amount),
        currency: payment.currency,
        receiptUrl,
      },
    };

    const input: NotifyInput = {
      userId: reg.user_id,
      type: 'payment_completed',
      referenceType: 'payment',
      referenceId: paymentId,
      actionUrl: receiptUrl,
      address,
      channelPrefs: prefs.channelPrefs,
      locale: prefs.locale,
      templateInput,
    };

    await notify(supabase, input);
  } catch (err) {
    console.error('[notifyPaymentCompleted] best-effort failure:', err);
  }
}

/**
 * Notify on refund processed. Best-effort.
 */
export async function notifyRefundProcessed(
  supabase: SupabaseClient,
  paymentId: string,
  reason: string
): Promise<void> {
  try {
    const { data: payment } = await supabase
      .from('payments')
      .select(`
        id, amount, currency, registration_id,
        event:events(id, title)
      `)
      .eq('id', paymentId)
      .maybeSingle();

    if (!payment) return;

    const event = Array.isArray(payment.event) ? payment.event[0] : payment.event;
    if (!event) return;

    const { data: reg } = await supabase
      .from('registrations')
      .select('user_id, attendee_name')
      .eq('id', payment.registration_id)
      .maybeSingle();

    if (!reg) return;

    const prefs = await loadUserPrefs(supabase, reg.user_id);
    const address = await loadUserAddress(supabase, reg.user_id);

    const templateInput: TemplateInputs = {
      kind: 'refund_processed',
      data: {
        name: reg.attendee_name,
        event: event.title,
        amount: String(payment.amount),
        currency: payment.currency,
        reason,
      },
    };

    const input: NotifyInput = {
      userId: reg.user_id,
      type: 'refund_processed',
      referenceType: 'payment',
      referenceId: paymentId,
      address,
      channelPrefs: prefs.channelPrefs,
      locale: prefs.locale,
      templateInput,
    };

    await notify(supabase, input);
  } catch (err) {
    console.error('[notifyRefundProcessed] best-effort failure:', err);
  }
}

/**
 * Notify on payout status change. Best-effort.
 */
export async function notifyPayoutUpdate(
  supabase: SupabaseClient,
  payoutId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed'
): Promise<void> {
  try {
    const { data: payout } = await supabase
      .from('payouts')
      .select(`
        id, amount, currency, status, organizer_id,
        organizers(profile_id, name)
      `)
      .eq('id', payoutId)
      .maybeSingle();

    if (!payout) return;

    const org = Array.isArray(payout.organizers) ? payout.organizers[0] : payout.organizers;
    if (!org) return;

    const prefs = await loadUserPrefs(supabase, org.profile_id);
    const address = await loadUserAddress(supabase, org.profile_id);

    const templateInput: TemplateInputs = {
      kind: 'payout_update',
      data: {
        name: org.name,
        amount: String(payout.amount),
        currency: payout.currency,
        status: payout.status as 'pending' | 'processing' | 'completed' | 'failed',
        reference: payout.id,
      },
    };

    const input: NotifyInput = {
      userId: org.profile_id,
      type: 'payout_update',
      referenceType: 'payout',
      referenceId: payoutId,
      address,
      channelPrefs: prefs.channelPrefs,
      locale: prefs.locale,
      templateInput,
    };

    await notify(supabase, input);
  } catch (err) {
    console.error('[notifyPayoutUpdate] best-effort failure:', err);
  }
}
