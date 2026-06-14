// ============================================================================
// Refund Library
// ============================================================================
// Shared refund logic. Flips payment status, voids the ticket, frees capacity.
// Uses service-role to coordinate cross-table writes that RLS can't express.
// Idempotent — already-refunded → no-op success.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { getPaymentProvider } from './index';
import { notifyRefundProcessed } from '@/lib/comms/domain-notify';

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
 * 0. Load payment + idempotency / concurrent-refund / status checks
 *      - status='refunded'      → success, no-op (idempotent)
 *      - status='refund_pending' → CONCURRENT_REFUND (in flight elsewhere)
 *      - status<>'completed'    → INVALID_STATUS
 * 1. FIN-2: Guarded state transition (begin_refund RPC) — atomically flips
 *    status 'completed' → 'refund_pending' IFF the current status is
 *    'completed'. Returns 1 if we won the race, 0 if not. Concurrent
 *    refund requests can never both win; only the first proceeds to
 *    the provider.
 * 2. Call provider.refund() (stub instant / Chapa config-deferred)
 * 3. On provider failure: roll status 'refund_pending' → 'completed'
 *    (only if still refund_pending — never clobber a concurrent
 *    successful flip to 'refunded') so a retry can win the gate again.
 * 4. On provider success: flip payment → status='refunded', set audit
 *    columns
 * 5. Void the ticket (status='cancelled')
 * 6. Cancel the registration
 * 7. Free capacity (ticket_tiers.sold_count decrement)
 * 8. Fire refund_processed notification (best-effort)
 *
 * Idempotent: if payment is already refunded, returns success with no
 * side-effects. The 'refund_pending' state is treated as in-flight and
 * returns CONCURRENT_REFUND — callers can surface a friendly "already
 * being processed" message without re-entering the provider call.
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

  // FIN-2: 'refund_pending' means another caller is mid-flight on this
  // payment — don't re-enter. Return CONCURRENT_REFUND so the caller
  // can surface a friendly "already being processed" message instead
  // of stomping on the in-progress provider call. A retry by the user
  // will see the final state (refunded or completed) once the in-flight
  // call resolves.
  if (payment.status === 'refund_pending') {
    return {
      success: false,
      message: 'Refund already in progress for this payment',
      error: 'CONCURRENT_REFUND',
    };
  }

  if (payment.status !== 'completed') {
    return {
      success: false,
      message: `Cannot refund payment with status '${payment.status}'`,
      error: 'INVALID_STATUS',
    };
  }

  // FIN-2: Guarded state transition BEFORE the provider call.
  // begin_refund() atomically flips status 'completed' → 'refund_pending'
  // IFF the current status is 'completed'. Returns 1 if we won the race,
  // 0 if another caller already won (status was no longer 'completed' —
  // it's now 'refund_pending' or 'refunded'). This prevents two
  // concurrent refunds from both calling provider.refund() on the same
  // payment.
  const { data: gateRows, error: gateError } = await supabase
    .rpc('begin_refund', { p_payment_id: payment.id });

  if (gateError) {
    return {
      success: false,
      message: `Refund gate error: ${gateError.message}`,
      error: 'GATE_ERROR',
    };
  }

  // Supabase RPC returns an array of rows; the SETOF INTEGER function
  // returns [{ begin_refund: 0/1 }] or [0/1] depending on the type
  // inference. Handle both.
  const gateValue = Array.isArray(gateRows)
    ? Number(gateRows[0]?.begin_refund ?? gateRows[0] ?? 0)
    : Number(gateRows ?? 0);

  if (gateValue !== 1) {
    return {
      success: false,
      message: 'Refund already in progress or payment not in a refundable state',
      error: 'CONCURRENT_REFUND',
    };
  }

  // 2. Call provider refund (V1: full amount). We've passed the gate —
  // we're the only caller who will hit the provider for this payment.
  const provider = getPaymentProvider();
  const refundResult = await provider.refund(
    payment.provider_ref ?? payment.id,
    payment.amount,
    { reason: input.reason }
  );

  if (!refundResult.success) {
    // FIN-2: Roll the row back from 'refund_pending' → 'completed' so a
    // retry can win the gate again. The conditional update (status =
    // 'refund_pending') is intentional: if some other path already moved
    // the row (e.g. a manual admin override to 'refunded', or another
    // caller that somehow completed the refund), we must NOT clobber
    // that state. The 'refund_pending' status filter guarantees the
    // rollback only fires for the row WE gated.
    await supabase
      .from('payments')
      .update({ status: 'completed' })
      .eq('id', payment.id)
      .eq('status', 'refund_pending');

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

  // 7. COMM-005: Fire best-effort refund_processed notification
  await notifyRefundProcessed(supabase, payment.id, input.reason);

  return {
    success: true,
    message: 'Refund processed successfully',
  };
}
