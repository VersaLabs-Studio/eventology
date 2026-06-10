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

  // Look up payment by provider_ref to get registration_id
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('registration_id')
    .eq('provider_ref', webhookResult.txRef)
    .single();

  if (paymentError || !payment) {
    return NextResponse.json(
      { error: { code: 'UNKNOWN_REF', message: 'Payment reference not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

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
