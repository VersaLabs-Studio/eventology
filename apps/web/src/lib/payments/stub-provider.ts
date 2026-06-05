// ============================================================================
// Stub Payment Provider (Development)
// ============================================================================
// Auto-resolves payments in dev without hitting any external API.
// Swap for ChapaProvider in production by setting PAYMENT_PROVIDER=chapa.
// ============================================================================

import type { PaymentProvider, PaymentInitResult, PaymentVerifyResult, PaymentWebhookResult } from './provider';

export class StubPaymentProvider implements PaymentProvider {
  /**
   * Simulates payment initiation.
   * Returns a fake checkout URL that auto-redirects back.
   */
  async initiate(
    registrationId: string,
    amount: number,
    currency: string,
    email: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentInitResult> {
    console.log(`[StubPayment] Initiating payment for registration ${registrationId}: ${amount} ${currency} (${email})`);

    // Simulate a small delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // FIX-002: Single Date.now() call — referenceId and checkoutUrl ref MUST match
    const ref = `stub_${registrationId}_${Date.now()}`;

    return {
      referenceId: ref,
      checkoutUrl: `/api/protected/payments/stub-callback?ref=${ref}`,
      metadata: {
        stub: true,
        amount,
        currency,
        ref, // Store ref in metadata so callback can use the exact same string
        ...metadata,
      },
    };
  }

  /**
   * Simulates payment verification.
   * Always succeeds in dev.
   */
  async verify(
    referenceId: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentVerifyResult> {
    console.log(`[StubPayment] Verifying payment ${referenceId}`);

    // Simulate a small delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      transactionId: `txn_${Date.now()}`,
      metadata: {
        stub: true,
        ...metadata,
      },
    };
  }

  /**
   * Simulates webhook processing.
   * Not used in dev flow (auto-confirm), but required by interface.
   */
  async webhook(
    payload: unknown,
    signature?: string
  ): Promise<PaymentWebhookResult> {
    console.log(`[StubPayment] Processing webhook`, { payload, signature: signature?.slice(0, 10) + '...' });

    return {
      success: true,
    };
  }
}
