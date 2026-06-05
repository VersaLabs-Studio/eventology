import { createHmac, timingSafeEqual } from 'crypto';

/**
 * HMAC-signed QR payload for forgery-resistant tickets.
 *
 * Format: `EVT-{ticketId}-{registrationId}-{hmacSignature}`
 * Signature: HMAC_SHA256(secret, "{ticketId}.{registrationId}") → base64url
 */

const HMAC_SECRET = process.env.TICKET_HMAC_SECRET ?? '';

/**
 * Signs a ticket QR payload with HMAC-SHA256.
 * @param ticketId - The ticket UUID
 * @param registrationId - The registration UUID
 * @returns The signed QR payload string
 */
export function signQRPayload(ticketId: string, registrationId: string): string {
  if (!HMAC_SECRET) {
    throw new Error('TICKET_HMAC_SECRET is not configured');
  }

  const message = `${ticketId}.${registrationId}`;
  const signature = createHmac('sha256', HMAC_SECRET)
    .update(message)
    .digest('base64url');

  return `EVT-${ticketId}-${registrationId}-${signature}`;
}

/**
 * Verifies a ticket QR payload's HMAC signature.
 * Uses constant-time comparison to prevent timing attacks.
 * @param payload - The QR payload string to verify
 * @returns Object with ticketId and registrationId if valid, null if invalid
 */
export function verifyQRPayload(payload: string): { ticketId: string; registrationId: string } | null {
  if (!HMAC_SECRET) {
    throw new Error('TICKET_HMAC_SECRET is not configured');
  }

  // Parse the payload
  const match = payload.match(/^EVT-([0-9a-f-]+)-([0-9a-f-]+)-(.+)$/);
  if (!match) {
    return null;
  }

  const [, ticketId, registrationId, providedSignature] = match;

  // Recompute the expected signature
  const message = `${ticketId}.${registrationId}`;
  const expectedSignature = createHmac('sha256', HMAC_SECRET)
    .update(message)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(providedSignature, 'base64url');
  const expectedBuffer = Buffer.from(expectedSignature, 'base64url');

  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  return { ticketId, registrationId };
}

/**
 * Checks if a QR payload is valid (signature matches).
 * @param payload - The QR payload string to check
 * @returns true if the signature is valid
 */
export function isQRPayloadValid(payload: string): boolean {
  return verifyQRPayload(payload) !== null;
}
