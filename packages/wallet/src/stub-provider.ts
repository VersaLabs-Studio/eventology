// ============================================================================
// @eventology/wallet — Stub Provider (V2.0 default)
// ============================================================================
// Deterministic, valid-SHAPED placeholder artifacts. No keys, no network, no
// real Apple/Google credentials (package constraint: never commit them).
//
//   Apple: the pass.json body of a .pkpass (the real artifact is this JSON
//          zipped with manifest + signature by the live provider). Served as
//          honest application/json — labeled stub, inspectable by humans.
//   Google: an in-app save URL — a real URL (no dead external link), clearly
//           marked as a stub via the walletStub query param.
// ============================================================================

import type {
  GoogleSaveLink,
  PassArtifact,
  WalletPlatform,
  WalletTicket,
} from './types';
import type { WalletProvider } from './provider';

export class StubWalletProvider implements WalletProvider {
  readonly name = 'stub';

  supports(platform: WalletPlatform): boolean {
    return platform === 'apple' || platform === 'google';
  }

  async buildApplePass(ticket: WalletTicket): Promise<PassArtifact> {
    // The pass.json shape inside a real .pkpass bundle (Apple Wallet spec).
    // The live provider zips this with manifest.json + signature via the
    // Apple pass signing cert; the stub serves it as plain JSON.
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: 'pass.com.eventology.stub',
      teamIdentifier: 'STUBTEAMID',
      serialNumber: ticket.serial,
      description: 'Eventology event ticket (stub)',
      organizationName: 'Eventology',
      eventTicket: {
        primaryFields: [
          { key: 'event', label: 'EVENT', value: ticket.eventTitle },
        ],
        secondaryFields: [
          { key: 'venue', label: 'WHERE', value: ticket.venueName ?? 'TBA' },
        ],
        auxiliaryFields: [
          {
            key: 'when',
            label: 'WHEN',
            value: new Date(ticket.eventStartsAt).toUTCString(),
          },
          { key: 'tier', label: 'TIER', value: ticket.tierName },
        ],
        backFields: [
          { key: 'holder', label: 'HOLDER', value: ticket.attendeeName },
          { key: 'ticketNumber', label: 'TICKET', value: ticket.ticketNumber },
          { key: 'qr', label: 'SCAN AT ENTRY', value: ticket.qrData },
        ],
      },
      barcode: {
        format: 'PKBarcodeFormatQR',
        message: ticket.qrData,
        messageEncoding: 'iso-8859-1',
      },
    };

    const body = new TextEncoder().encode(JSON.stringify(passJson, null, 2));

    return {
      contentType: 'application/json',
      filename: `${ticket.serial}-pass.json`,
      body,
    };
  }

  async buildGoogleSaveUrl(ticket: WalletTicket): Promise<GoogleSaveLink> {
    // The live provider mints a signed JWT save link against the Google
    // Wallet API. The stub returns an in-app URL: real and harmless, clearly
    // marked as a stub via the walletStub param.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eventology.app';
    return {
      url: `${appUrl}/ticket/${ticket.ticketId}?walletStub=${encodeURIComponent(ticket.serial)}`,
    };
  }
}
