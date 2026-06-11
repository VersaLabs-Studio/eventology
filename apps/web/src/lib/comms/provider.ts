// ============================================================================
// Channel Provider Interface
// ============================================================================
// Abstraction for delivery channels (email/SMS/push). All real providers
// are config-deferred (inert until keys present); the default is a stub
// that logs + records a delivery row but sends nothing. Mirrors the
// payment provider factory pattern (P2).
// ============================================================================

import type { NotificationChannel } from '@eventology/schemas';

/** Per-channel rendered content (post-i18n, post-template). */
export interface RenderedContent {
  /** Subject (email) or title (push) */
  subject: string;
  /** Plain-text body (SMS) or pre-HTML plaintext fallback (email) */
  textBody: string;
  /** HTML body (email only; undefined for SMS / push) */
  htmlBody?: string;
  /** Channel-specific metadata (e.g. deep link for push) */
  metadata?: Record<string, unknown>;
}

export interface ChannelSendResult {
  /** Whether the provider accepted the send */
  success: boolean;
  /** Provider-specific message/transaction reference (e.g. Resend message-id) */
  providerRef?: string;
  /** Error message if the send failed */
  error?: string;
  /** Provider name (for delivery row audit) */
  providerName: string;
}

/**
 * The destination address for a channel send. Each channel has a different
 * shape (email → email; SMS → phone; push → Expo token list).
 */
export type ChannelAddress = {
  email?: string;
  phone?: string;
  pushTokens?: string[];
};

export interface NotificationChannelProvider {
  /** Channel this provider serves */
  readonly channel: NotificationChannel;
  /**
   * Sends a rendered message to the given address.
   * Implementations must NOT throw on transient errors — they must
   * return { success: false, error } so the orchestrator can record
   * the failure on the delivery row.
   */
  send(
    address: ChannelAddress,
    content: RenderedContent
  ): Promise<ChannelSendResult>;
}
