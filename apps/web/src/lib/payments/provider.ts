// ============================================================================
// Payment Provider Interface
// ============================================================================
// Abstraction for payment providers (Chapa, Telebirr, etc.).
// The stub auto-resolves in dev; swap for ChapaProvider later by config.
// ============================================================================

export interface PaymentInitResult {
  /** Provider-specific reference ID */
  referenceId: string;
  /** URL to redirect the user to complete payment */
  checkoutUrl: string;
  /** Provider-specific metadata */
  metadata: Record<string, unknown>;
}

export interface PaymentVerifyResult {
  /** Whether the payment was successful */
  success: boolean;
  /** Provider-specific transaction ID */
  transactionId?: string;
  /** Error message if verification failed */
  error?: string;
  /** Provider-specific metadata */
  metadata: Record<string, unknown>;
}

export interface PaymentWebhookResult {
  /** Whether the webhook was valid and processed */
  success: boolean;
  /** The provider's transaction reference (tx_ref for Chapa) */
  txRef?: string;
  /** The registration ID associated with the payment */
  registrationId?: string;
  /** Error message if processing failed */
  error?: string;
}

export interface PaymentProvider {
  /**
   * Initiates a payment for a registration.
   * @param registrationId - The registration UUID
   * @param amount - Amount in the event's currency
   * @param currency - Currency code (e.g., 'ETB')
   * @param email - Customer email for receipt
   * @param metadata - Additional provider-specific data
   */
  initiate(
    registrationId: string,
    amount: number,
    currency: string,
    email: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentInitResult>;

  /**
   * Verifies a payment after the user completes checkout.
   * @param referenceId - The provider reference from initiate()
   * @param metadata - Provider-specific verification data
   */
  verify(
    referenceId: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentVerifyResult>;

  /**
   * Processes a webhook from the payment provider.
   * @param payload - Raw webhook payload
   * @param signature - Webhook signature for verification
   */
  webhook(
    payload: unknown,
    signature?: string
  ): Promise<PaymentWebhookResult>;
}
