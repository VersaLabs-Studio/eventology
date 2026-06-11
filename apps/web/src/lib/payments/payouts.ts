// ============================================================================
// Payout Library
// ============================================================================
// Balance computation, payout request, and lifecycle management.
// Disbursement provider calls are stubbed via the PaymentProvider seam.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

export interface OrganizerBalance {
  /** Total earned (Σ organizer_amount of completed payments) */
  totalEarned: number;
  /** Total already paid out (Σ non-failed payouts) */
  totalPaidOut: number;
  /** Total refunded (Σ refund_amount of refunded payments) */
  totalRefunded: number;
  /** Available balance = earned - paidOut - refunded */
  availableBalance: number;
  currency: string;
}

/**
 * Computes the organizer's available balance from the payment ledger.
 * Money-safe: uses 2dp rounding at the boundary.
 *
 * balance = Σ(organizer_amount WHERE payment.status='completed')
 *        − Σ(amount WHERE payout.status IN ('pending','processing','completed'))
 *        − Σ(refund_amount WHERE payment.status='refunded')
 */
export async function computeOrganizerBalance(
  supabase: SupabaseClient,
  organizerId: string
): Promise<OrganizerBalance> {
  // 1. Sum organizer_amount from completed payments for this organizer's events
  const { data: earnedData } = await supabase
    .from('payments')
    .select('amount, currency, organizer_amount, events!inner(organizer_id)')
    .eq('status', 'completed')
    .eq('events.organizer_id', organizerId);

  // 2. Sum amounts from non-failed payouts
  const { data: payoutData } = await supabase
    .from('payouts')
    .select('amount')
    .eq('organizer_id', organizerId)
    .in('status', ['pending', 'processing', 'completed']);

  // 3. Sum refund_amount from refunded payments
  const { data: refundData } = await supabase
    .from('payments')
    .select('refund_amount, events!inner(organizer_id)')
    .eq('status', 'refunded')
    .eq('events.organizer_id', organizerId);

  let totalEarned = 0;
  let currency = 'ETB';
  for (const row of earnedData ?? []) {
    totalEarned += Number(row.organizer_amount ?? 0);
    if (row.currency) currency = row.currency as string;
  }

  let totalPaidOut = 0;
  for (const row of payoutData ?? []) {
    totalPaidOut += Number(row.amount ?? 0);
  }

  let totalRefunded = 0;
  for (const row of refundData ?? []) {
    totalRefunded += Number(row.refund_amount ?? 0);
  }

  const availableBalance = Math.round((totalEarned - totalPaidOut - totalRefunded) * 100) / 100;

  return {
    totalEarned: Math.round(totalEarned * 100) / 100,
    totalPaidOut: Math.round(totalPaidOut * 100) / 100,
    totalRefunded: Math.round(totalRefunded * 100) / 100,
    availableBalance: Math.max(0, availableBalance),
    currency,
  };
}

export interface PayoutRequestResult {
  success: boolean;
  payoutId?: string;
  message: string;
  error?: string;
}

/**
 * Creates a payout request. Validates against available balance.
 * Service-role justified: cross-table reads (balance computation) +
 * insert into payouts with RLS bypass for system-generated rows.
 */
export async function requestPayout(
  supabase: SupabaseClient,
  organizerId: string,
  amount: number,
  eventId: string | null,
  bankAccount: Record<string, unknown>
): Promise<PayoutRequestResult> {
  // Guard: must be a positive amount
  if (amount <= 0) {
    return { success: false, message: 'Payout amount must be positive', error: 'INVALID_AMOUNT' };
  }

  // Compute available balance
  const balance = await computeOrganizerBalance(supabase, organizerId);
  if (amount > balance.availableBalance) {
    return {
      success: false,
      message: `Requested amount (${amount}) exceeds available balance (${balance.availableBalance})`,
      error: 'INSUFFICIENT_BALANCE',
    };
  }

  // Insert the payout row in 'pending' status
  const { data: payout, error: insertError } = await supabase
    .from('payouts')
    .insert({
      organizer_id: organizerId,
      event_id: eventId,
      amount,
      currency: balance.currency,
      status: 'pending',
      bank_account: bankAccount,
    })
    .select()
    .single();

  if (insertError || !payout) {
    return {
      success: false,
      message: insertError?.message ?? 'Failed to create payout',
      error: insertError?.code ?? 'DB_ERROR',
    };
  }

  return { success: true, payoutId: payout.id, message: 'Payout request created' };
}

export interface ProcessPayoutResult {
  success: boolean;
  message: string;
  status: 'processing' | 'completed' | 'failed';
  providerRef?: string;
  error?: string;
}

/**
 * Advances a payout through the lifecycle:
 * pending → processing → completed/failed
 *
 * Disbursement provider call is stubbed (stub instant / Chapa config-deferred).
 *
 * Service-role justified: system-level payout processing that RLS can't express.
 */
export async function processPayout(
  supabase: SupabaseClient,
  payoutId: string,
  providerDisburser: (referenceId: string, amount: number) => Promise<{ success: boolean; reference?: string; error?: string }>
): Promise<ProcessPayoutResult> {
  // Load the payout
  const { data: payout, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('id', payoutId)
    .single();

  if (error || !payout) {
    return { success: false, message: 'Payout not found', status: 'failed', error: 'NOT_FOUND' };
  }

  // Lifecycle guard: only pending → processing
  if (payout.status !== 'pending') {
    return {
      success: false,
      message: `Payout is in status '${payout.status}', not 'pending'`,
      status: payout.status as 'processing' | 'completed' | 'failed',
      error: 'INVALID_STATUS',
    };
  }

  // Move to processing
  await supabase
    .from('payouts')
    .update({ status: 'processing', processed_at: new Date().toISOString() })
    .eq('id', payoutId);

  // Call provider disburser
  const providerResult = await providerDisburser(payout.id, Number(payout.amount));

  if (!providerResult.success) {
    await supabase
      .from('payouts')
      .update({ status: 'failed', notes: providerResult.error ?? 'Provider disbursement failed' })
      .eq('id', payoutId);
    return {
      success: false,
      message: providerResult.error ?? 'Disbursement failed',
      status: 'failed',
      error: 'PROVIDER_FAILED',
    };
  }

  // Complete
  await supabase
    .from('payouts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      provider_ref: providerResult.reference ?? null,
    })
    .eq('id', payoutId);

  return {
    success: true,
    message: 'Payout completed',
    status: 'completed',
    providerRef: providerResult.reference,
  };
}
