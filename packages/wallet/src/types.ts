// ============================================================================
// @eventology/wallet — Types
// ============================================================================
// The data the pass payload derives from. Everything here is resolved
// SERVER-SIDE from the ticket row (the QR/HMAC included) — pass payloads are
// never generated on the client.
// ============================================================================

export type WalletPlatform = 'apple' | 'google';

/**
 * The server-resolved ticket snapshot a pass is built from.
 * `serial` is the issued wallet-pass serial (unique per ticket+platform).
 */
export interface WalletTicket {
  ticketId: string;
  ticketNumber: string;
  tierName: string;
  /** The server-signed QR payload (HMAC) — embedded in the pass barcode. */
  qrData: string;
  eventTitle: string;
  eventStartsAt: string;
  venueName: string | null;
  attendeeName: string;
  attendeeEmail: string;
  serial: string;
}

/**
 * Apple: the pass artifact. The LIVE provider produces a signed, zipped
 * `.pkpass` (manifest + signature over pass.json); the STUB returns the
 * pass.json-shaped JSON as a placeholder — valid-shaped, honestly labeled.
 */
export interface PassArtifact {
  contentType: string;
  filename: string;
  body: Uint8Array;
}

/** Google: the save URL the client opens. */
export interface GoogleSaveLink {
  url: string;
}
