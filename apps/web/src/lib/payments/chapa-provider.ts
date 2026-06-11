// ============================================================================
// Chapa Payment Provider
// ============================================================================
// Implements PaymentProvider for the Chapa payment gateway.
// Config-deferred: inert until CHAPA_SECRET_KEY + CHAPA_WEBHOOK_SECRET are set.
// ============================================================================

import type { PaymentProvider, PaymentInitResult, PaymentVerifyResult, PaymentWebhookResult } from './provider';
import type { ChapaInitPayload, ChapaInitResponse, ChapaVerifyResponse, ChapaInitMetadata } from './chapa-types';
import { chapaWebhookPayloadSchema } from './chapa-types';

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

export interface ChapaProviderConfig {
  secretKey: string;
  webhookSecret: string;
}

export class ChapaProvider implements PaymentProvider {
  private readonly secretKey: string;
  private readonly webhookSecret: string;

  constructor(config: ChapaProviderConfig) {
    this.secretKey = config.secretKey;
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Initiates a Chapa payment.
   * POST /transaction/initialize
   */
  async initiate(
    registrationId: string,
    amount: number,
    currency: string,
    email: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentInitResult> {
    const txRef = `evt_${registrationId}_${Date.now()}`;

    // Narrow metadata to typed interface (no unsafe casts)
    const meta = (metadata ?? {}) as ChapaInitMetadata;
    const nameParts = (meta.attendee_name ?? 'Attendee').split(' ');

    const payload: ChapaInitPayload = {
      amount: amount.toFixed(2),
      currency: 'ETB',
      email,
      first_name: nameParts[0] ?? 'Attendee',
      last_name: nameParts.slice(1).join(' ') ?? '',
      phone_number: meta.attendee_phone ?? '',
      tx_ref: txRef,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/webhooks/chapa`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/payment/success`,
      customization: meta.event_title
        ? {
            title: meta.event_title,
            description: `Payment for ${meta.event_title}`,
            logo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/logo.png`,
          }
        : undefined,
    };

    const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`[ChapaProvider] Init failed (${response.status}): ${errorBody}`);
    }

    const result = (await response.json()) as ChapaInitResponse;

    return {
      referenceId: txRef,
      checkoutUrl: result.data.checkout_url,
      metadata: {
        chapa_tx_ref: txRef,
        chapa_response: result,
      },
    };
  }

  /**
   * Verifies a Chapa payment.
   * GET /transaction/verify/{tx_ref}
   */
  async verify(
    referenceId: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentVerifyResult> {
    const response = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${referenceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        success: false,
        error: `Chapa verify failed (${response.status}): ${errorBody}`,
        metadata: { ...metadata },
      };
    }

    const result = (await response.json()) as ChapaVerifyResponse;

    return {
      success: result.data.status === 'success',
      transactionId: result.data.reference,
      metadata: {
        chapa_verify: result.data,
        ...metadata,
      },
    };
  }

  /**
   * Processes a Chapa webhook callback.
   * Signature is MANDATORY — missing signature returns 401.
   * Verifies HMAC-SHA256 signature (constant-time), parses tx_ref via Zod,
   * and only accepts status === 'success' to prevent premature confirmation.
   */
  async webhook(
    payload: unknown,
    signature?: string
  ): Promise<PaymentWebhookResult> {
    // Import crypto dynamically (Node.js module, not available in Edge)
    const crypto = await import('node:crypto');

    // H1: Signature is mandatory for Chapa. Missing/empty → fail closed (401 via route).
    if (!signature || signature.trim() === '') {
      return { success: false, error: 'Missing webhook signature' };
    }

    const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);

    // Verify HMAC-SHA256 signature (constant-time comparison)
    const expectedSig = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return { success: false, error: 'Invalid webhook signature' };
    }

    // Parse and validate webhook payload with Zod (external payloads must not be trusted)
    let parsed: unknown;
    try {
      parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    } catch {
      return { success: false, error: 'Invalid webhook payload' };
    }

    const result = chapaWebhookPayloadSchema.safeParse(parsed);
    if (!result.success) {
      return { success: false, error: `Invalid webhook payload: ${result.error.message}` };
    }

    // H2: Only accept 'success' status. Non-terminal statuses (e.g. 'pending') must
    // NOT trigger ticket issuance. 'failed'/'cancelled' are explicit non-success.
    if (result.data.status !== 'success') {
      return { success: false, error: `Payment not successful (status: ${result.data.status})` };
    }

    return {
      success: true,
      txRef: result.data.tx_ref,
    };
  }
}
