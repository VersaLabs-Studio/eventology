// ============================================================================
// Shared Payment Confirmation Helper
// ============================================================================
// Used by both stub-callback and Chapa webhook routes.
// Idempotent — returns existing ticket if payment already completed.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { issueTicket } from '@/lib/tickets/issue-ticket';

export interface ConfirmPaymentResult {
  success: boolean;
  message: string;
  ticket?: { id: string; ticket_number: string; qr_data: string; tier_name: string; status: string };
  error?: string;
}

/**
 * Shared payment confirmation logic.
 * Finds payment by provider_ref, confirms it, and issues a ticket.
 *
 * @param providerRef - The provider's transaction reference
 * @param supabase - Supabase client (service-role for webhook, authed for stub-callback)
 * @param opts.userId - If provided, verifies payment ownership (for user-scoped routes)
 *
 * Service-role justified: system ops (payment confirmation + ticket issuance)
 * require cross-table writes that RLS can't express.
 */
export async function confirmPayment(
  providerRef: string,
  supabase: SupabaseClient,
  opts?: { userId?: string }
): Promise<ConfirmPaymentResult> {
  // Find the payment by reference
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('provider_ref', providerRef)
    .single();

  if (paymentError || !payment) {
    return {
      success: false,
      message: 'Payment not found',
      error: 'PAYMENT_NOT_FOUND',
    };
  }

  // Ownership check (for user-scoped routes like stub-callback)
  if (opts?.userId && payment.user_id !== opts.userId) {
    return {
      success: false,
      message: 'Not authorized to confirm this payment',
      error: 'FORBIDDEN',
    };
  }

  // Idempotency — if payment is already completed, return existing ticket
  if (payment.status === 'completed') {
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id, ticket_number, qr_data, tier_name, status')
      .eq('registration_id', payment.registration_id)
      .maybeSingle();

    return {
      success: true,
      message: 'Payment already confirmed',
      ticket: existingTicket ?? undefined,
    };
  }

  // Update payment status to completed
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      paid_at: new Date().toISOString(),
    })
    .eq('id', payment.id);

  if (updateError) {
    return {
      success: false,
      message: 'Failed to update payment status',
      error: updateError.message,
    };
  }

  // Confirm the registration
  const { error: regError } = await supabase
    .from('registrations')
    .update({ status: 'confirmed' })
    .eq('id', payment.registration_id);

  if (regError) {
    return {
      success: false,
      message: 'Failed to confirm registration',
      error: regError.message,
    };
  }

  // Issue ticket with signed QR (idempotent — returns existing if already issued)
  const ticketResult = await issueTicket(payment.registration_id, supabase);

  if (!ticketResult.success) {
    return {
      success: false,
      message: 'Payment confirmed but ticket issuance failed',
      error: ticketResult.error,
    };
  }

  return {
    success: true,
    message: 'Payment confirmed and ticket issued',
    ticket: ticketResult.ticket,
  };
}
