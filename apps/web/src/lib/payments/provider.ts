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

export interface PaymentRefundResult {
  /** Whether the refund was successful */
  success: boolean;
  /** Provider-specific refund reference */
  refundRef?: string;
  /** Error message if refund failed */
  error?: string;
  /** Provider-specific metadata */
  metadata: Record<string, unknown>;
}

export interface PaymentProvider {
  /**
   * Initiates a payment for a registration.
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
   */
  verify(
    referenceId: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentVerifyResult>;

  /**
   * Processes a webhook from the payment provider.
   */
  webhook(
    payload: unknown,
    signature?: string
  ): Promise<PaymentWebhookResult>;

  /**
   * Issues a refund for a previously completed payment.
   * V1: full refund only. Stub resolves instantly; Chapa is config-deferred.
   */
  refund(
    referenceId: string,
    amount: number,
    metadata?: Record<string, unknown>
  ): Promise<PaymentRefundResult>;
}
