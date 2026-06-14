import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments';
import { confirmPayment } from '@/lib/payments/confirm-payment';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/webhooks/chapa
 * External callback from Chapa payment gateway.
 * No session — public route (middleware whitelists /api/webhooks).
 *
 * Flow:
 * 1. Read raw body for signature verification
 * 2. Call provider.webhook() to verify HMAC and parse payload
 * 3. Look up payment by provider_ref = txRef → get registration_id
 * 4. On success: confirmPayment() via service-role client
 * 5. Return 200 on processed/idempotent, 401 invalid sig, 404 unknown ref
 *
 * Service-role justified: external callback, no user session;
 * cross-table writes (payments → registrations → tickets)
 */
export async function POST(req: NextRequest) {
  // Read raw body (must be string for HMAC verification)
  const rawBody = await req.text();
  const signature = req.headers.get('x-chapa-signature') ?? undefined;

  // Get provider and delegate webhook verification
  const provider = getPaymentProvider();
  const webhookResult = await provider.webhook(rawBody, signature);

  if (!webhookResult.success) {
    return NextResponse.json(
      { error: { code: 'WEBHOOK_INVALID', message: webhookResult.error ?? 'Invalid webhook' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  if (!webhookResult.txRef) {
    return NextResponse.json(
      { error: { code: 'UNKNOWN_REF', message: 'Missing transaction reference in webhook' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Service-role justified: external callback, no user session;
  // cross-table writes (payments → registrations → tickets)
  const supabase = createServiceClient();

  // S6: Server-side verify — don't trust webhook body alone.
  // Query Chapa's verify endpoint to confirm the payment is actually settled
  // before issuing tickets. This prevents spoofed webhooks from triggering
  // ticket issuance even if HMAC verification were bypassed.
  const verifyResult = await provider.verify(webhookResult.txRef);
  if (!verifyResult.success) {
    return NextResponse.json(
      { error: { code: 'VERIFY_FAILED', message: verifyResult.error ?? 'Server-side verification failed' } } satisfies ErrorEnvelope,
      { status: 402 }
    );
  }

  // S6 (carry-forward Day 12): Amount cross-check.
  // The verify response includes a denormalized amount from the provider. We
  // compare it against the local payment's amount and reject (409) on mismatch.
  // This closes the last spoofing gap — even a valid HMAC+status can't fake a
  // different amount than what the provider actually settled.
  const providerAmount = (verifyResult.metadata?.chapa_verify as { amount?: number })?.amount;
  if (providerAmount === undefined) {
    return NextResponse.json(
      { error: { code: 'AMOUNT_MISSING', message: 'Provider verify response missing amount' } } satisfies ErrorEnvelope,
      { status: 402 }
    );
  }

  // Look up payment by provider_ref to get the local amount
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, registration_id, amount')
    .eq('provider_ref', webhookResult.txRef)
    .single();

  if (paymentError || !payment) {
    return NextResponse.json(
      { error: { code: 'UNKNOWN_REF', message: 'Payment reference not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  // Cross-check: provider amount must match local amount (2dp-safe)
  const localAmount = Math.round(Number(payment.amount) * 100) / 100;
  const verifiedAmount = Math.round(Number(providerAmount) * 100) / 100;
  if (verifiedAmount !== localAmount) {
    // Persist the mismatch for audit
    await supabase
      .from('payments')
      .update({ provider_amount: verifiedAmount, notes: `AMOUNT_MISMATCH: local=${localAmount} provider=${verifiedAmount}` })
      .eq('id', payment.id);

    return NextResponse.json(
      { error: { code: 'AMOUNT_MISMATCH', message: `Provider amount ${verifiedAmount} does not match local amount ${localAmount}` } } satisfies ErrorEnvelope,
      { status: 409 }
    );
  }

  // Amounts match — persist provider_amount for audit
  await supabase
    .from('payments')
    .update({ provider_amount: verifiedAmount })
    .eq('id', payment.id);

  // confirmPayment is idempotent — safe for replays
  const result = await confirmPayment(webhookResult.txRef, supabase);

  if (!result.success) {
    return NextResponse.json(
      { error: { code: 'CONFIRM_FAILED', message: result.error ?? 'Failed to confirm payment' } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: result.message });
}
