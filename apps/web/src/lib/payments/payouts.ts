// ============================================================================
// Payout Library
// ============================================================================
// Balance computation, payout request, and lifecycle management.
// Disbursement provider calls are stubbed via the PaymentProvider seam.
// FIN-1: balance-check + insert moved into a SECURITY DEFINER RPC
// (request_payout_atomic) that locks the organizer's ledger rows
// (FOR UPDATE) — same pattern as apply_promo_code. The
// pending→processing transition is a guarded conditional update
// (begin_payout_processing) returning the affected row count.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { notifyPayoutUpdate } from '@/lib/comms/domain-notify';

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
 * Creates a payout request. FIN-1: delegates to the
 * request_payout_atomic RPC which locks the organizer's ledger
 * rows (FOR UPDATE), recomputes the balance inside the lock, and
 * inserts the payout in one transaction. Concurrent requests for
 * the same organizer serialize, preventing over-disbursement.
 *
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
  // Guard: must be a positive amount (RPC also checks; mirror here for fast-fail)
  if (amount <= 0) {
    return { success: false, message: 'Payout amount must be positive', error: 'INVALID_AMOUNT' };
  }

  // FIN-1: Atomic balance-check + insert via SECURITY DEFINER RPC.
  const { data, error } = await supabase.rpc('request_payout_atomic', {
    p_organizer_id: organizerId,
    p_event_id: eventId ?? null,
    p_amount: amount,
    p_currency: 'ETB', // V1: ETB only
    p_bank_account: bankAccount,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
      error: 'DB_ERROR',
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.success) {
    const errCode = row?.error_message ?? 'PAYOUT_FAILED';
    return {
      success: false,
      message: errCode === 'INSUFFICIENT_BALANCE'
        ? `Requested amount (${amount}) exceeds available balance`
        : errCode,
      error: errCode,
    };
  }

  return {
    success: true,
    payoutId: row.payout_id ?? undefined,
    message: 'Payout request created',
  };
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
 * FIN-1: The pending→processing transition is a guarded conditional
 * update (begin_payout_processing RPC) returning the affected row
 * count. If 0 rows hit, another caller already advanced the payout
 * and we abort — preventing concurrent double-disbursement.
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

  // FIN-1: Guarded transition via RPC. Returns 1 if we won the race, 0
  // if another caller already advanced the row.
  const { data: gateData, error: gateError } = await supabase
    .rpc('begin_payout_processing', { p_payout_id: payoutId });

  if (gateError) {
    return {
      success: false,
      message: `Payout gate error: ${gateError.message}`,
      status: 'failed',
      error: 'GATE_ERROR',
    };
  }

  const gateRows = Array.isArray(gateData)
    ? Number(gateData[0]?.begin_payout_processing ?? gateData[0] ?? 0)
    : Number(gateData ?? 0);

  if (gateRows !== 1) {
    return {
      success: false,
      message: 'Payout already being processed or no longer in pending state',
      status: payout.status as 'processing' | 'completed' | 'failed',
      error: 'CONCURRENT_PROCESSING',
    };
  }

  // We're the only caller past the gate. Call the provider disburser.
  const providerResult = await providerDisburser(payout.id, Number(payout.amount));

  if (!providerResult.success) {
    await supabase
      .from('payouts')
      .update({ status: 'failed', notes: providerResult.error ?? 'Provider disbursement failed' })
      .eq('id', payoutId);

    // COMM-005: Best-effort payout_failed notification
    await notifyPayoutUpdate(supabase, payoutId, 'failed');

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

  // COMM-005: Best-effort payout_completed notification
  await notifyPayoutUpdate(supabase, payoutId, 'completed');

  return {
    success: true,
    message: 'Payout completed',
    status: 'completed',
    providerRef: providerResult.reference,
  };
}
