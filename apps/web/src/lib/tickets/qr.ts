import { createHmac, timingSafeEqual } from 'crypto';

/**
 * HMAC-signed QR payload for forgery-resistant tickets.
 *
 * Legacy format (pre-HO-G, still verified):
 *   `EVT-{ticketId}-{registrationId}-{hmacSignature}`
 *   Signature: HMAC_SHA256(secret, "{ticketId}.{registrationId}") → base64url
 *
 * Versioned format (HO-G ticket transfers — rotation support):
 *   `EVT2-{ticketId}-{registrationId}-{version}-{hmacSignature}`
 *   Signature: HMAC_SHA256(secret, "{ticketId}.{registrationId}.{version}")
 *
 * The version bumps on every ownership transfer, so a transferred ticket's
 * OLD QR fails both HMAC (message changed) and the check-in version
 * comparison against `tickets.qr_version`. Version 0 = never transferred;
 * legacy payloads parse as version 0, so existing tickets keep scanning.
 */

const HMAC_SECRET = process.env.TICKET_HMAC_SECRET ?? '';

/**
 * Signs a ticket QR payload with HMAC-SHA256.
 * @param ticketId - The ticket UUID
 * @param registrationId - The registration UUID
 * @param version - QR rotation version (bump on transfer; 0 = legacy)
 * @returns The signed QR payload string
 */
export function signQRPayload(
  ticketId: string,
  registrationId: string,
  version = 0
): string {
  if (!HMAC_SECRET) {
    throw new Error('TICKET_HMAC_SECRET is not configured');
  }

  const message = version === 0
    ? `${ticketId}.${registrationId}`
    : `${ticketId}.${registrationId}.${version}`;
  const signature = createHmac('sha256', HMAC_SECRET)
    .update(message)
    .digest('base64url');

  return version === 0
    ? `EVT-${ticketId}-${registrationId}-${signature}`
    : `EVT2-${ticketId}-${registrationId}-${version}-${signature}`;
}

/**
 * Verifies a ticket QR payload's HMAC signature (both formats).
 * Uses constant-time comparison to prevent timing attacks.
 * @param payload - The QR payload string to verify
 * @returns Object with ticketId, registrationId and rotation version if valid, null if invalid
 */
export function verifyQRPayload(
  payload: string
): { ticketId: string; registrationId: string; version: number } | null {
  if (!HMAC_SECRET) {
    throw new Error('TICKET_HMAC_SECRET is not configured');
  }

  // Versioned format (HO-G). Bounded {36} uuid groups make the split
  // unambiguous (base64url signatures can contain '-').
  const v2 = payload.match(
    /^EVT2-([0-9a-fA-F-]{36})-([0-9a-fA-F-]{36})-(\d+)-([A-Za-z0-9_-]+)$/
  );
  if (v2) {
    const [, ticketId, registrationId, versionStr, providedSignature] = v2;
    const version = Number(versionStr);
    const message = `${ticketId}.${registrationId}.${version}`;
    const expectedSignature = createHmac('sha256', HMAC_SECRET)
      .update(message)
      .digest('base64url');

    const sigBuffer = Buffer.from(providedSignature, 'base64url');
    const expectedBuffer = Buffer.from(expectedSignature, 'base64url');

    if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }
    return { ticketId, registrationId, version };
  }

  // Legacy format → version 0 (never transferred).
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

  return { ticketId, registrationId, version: 0 };
}

/**
 * Checks if a QR payload is valid (signature matches).
 * @param payload - The QR payload string to check
 * @returns true if the signature is valid
 */
export function isQRPayloadValid(payload: string): boolean {
  return verifyQRPayload(payload) !== null;
}
