// ============================================================================
// Refund Library
// ============================================================================
// Shared refund logic. Flips payment status, voids the ticket, frees capacity.
// Uses service-role to coordinate cross-table writes that RLS can't express.
// Idempotent — already-refunded → no-op success.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { getPaymentProvider } from './index';

export interface RefundResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface RefundInput {
  paymentId: string;
  reason: string;
  refundedBy: string; // Profile UUID
}

/**
 * Processes a full refund for a payment.
 * Flow:
 * 1. Load payment + verify it's refundable (status = 'completed')
 * 2. Call provider.refund() (stub instant / Chapa config-deferred)
 * 3. Flip payment → status='refunded', set audit columns
 * 4. Void the ticket (status='cancelled')
 * 5. Cancel the registration
 * 6. Free capacity (ticket_tiers.sold_count decrement)
 *
 * Idempotent: if payment is already refunded, returns success with no side-effects.
 *
 * Service-role justified: cross-table writes (payments + tickets + registrations +
 * ticket_tiers) that RLS can't express.
 */
export async function processRefund(
  supabase: SupabaseClient,
  input: RefundInput
): Promise<RefundResult> {
  // 1. Load payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, status, amount, currency, provider, provider_ref, registration_id, event_id')
    .eq('id', input.paymentId)
    .single();

  if (paymentError || !payment) {
    return { success: false, message: 'Payment not found', error: 'PAYMENT_NOT_FOUND' };
  }

  // Idempotency
  if (payment.status === 'refunded') {
    return { success: true, message: 'Payment already refunded' };
  }

  if (payment.status !== 'completed') {
    return {
      success: false,
      message: `Cannot refund payment with status '${payment.status}'`,
      error: 'INVALID_STATUS',
    };
  }

  // 2. Call provider refund (V1: full amount)
  const provider = getPaymentProvider();
  const refundResult = await provider.refund(
    payment.provider_ref ?? payment.id,
    payment.amount,
    { reason: input.reason }
  );

  if (!refundResult.success) {
    return {
      success: false,
      message: refundResult.error ?? 'Provider refund failed',
      error: 'PROVIDER_REFUND_FAILED',
    };
  }

  const now = new Date().toISOString();

  // 3. Flip payment → refunded
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'refunded',
      refunded_at: now,
      refund_amount: payment.amount, // V1: always full
      refund_reason: input.reason,
      refunded_by: input.refundedBy,
      provider_ref: refundResult.refundRef ?? payment.provider_ref,
    })
    .eq('id', payment.id);

  if (updateError) {
    return { success: false, message: 'Failed to update payment', error: updateError.message };
  }

  // 4. Void the ticket
  await supabase
    .from('tickets')
    .update({ status: 'cancelled' })
    .eq('registration_id', payment.registration_id);

  // 5. Cancel the registration
  await supabase
    .from('registrations')
    .update({ status: 'cancelled' })
    .eq('id', payment.registration_id);

  // 6. Free capacity (decrement ticket_tiers.sold_count, floor at 0)
  // Load the registration to get the tier id
  const { data: reg } = await supabase
    .from('registrations')
    .select('ticket_tier_id')
    .eq('id', payment.registration_id)
    .single();

  if (reg?.ticket_tier_id) {
    // Atomic decrement with floor-at-0 guard (REV-004 capacity release).
    // Uses the dedicated RPC from migration 025 — not the existing
    // cancel_registration RPC (which derives the caller from auth.uid(),
    // inappropriate for organizer/admin-initiated refunds).
    try {
      await supabase.rpc('decrement_ticket_tier_sold_count', {
        p_tier_id: reg.ticket_tier_id,
      });
    } catch {
      // Best-effort capacity release — don't fail the refund if this errors
    }
  }

  return {
    success: true,
    message: 'Refund processed successfully',
  };
}
