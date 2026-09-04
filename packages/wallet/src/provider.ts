// ============================================================================
// @eventology/wallet — Provider Seam
// ============================================================================
// Mirrors the AI seam (packages/ai/src/provider.ts): a narrow provider
// contract, a stub default, and a factory keyed off WALLET_PROVIDER.
//
// Two providers ship:
//   - StubWalletProvider — default. Valid-shaped placeholder artifacts, no
//                          keys, no network. WALLET_PROVIDER=stub.
//   - (live providers land here when Apple/Google credentials drop — e.g.
//                          AppleWalletProvider producing signed .pkpass zips
//                          and GoogleWalletProvider minting save-link JWTs.)
//
// Selection is keyed off `process.env.WALLET_PROVIDER` (default 'stub').
// Selecting an unimplemented live provider throws a LOUD config error at
// first call — no silent fallback to stub; misconfig must be obvious.
// ============================================================================

import type {
  GoogleSaveLink,
  PassArtifact,
  WalletPlatform,
  WalletTicket,
} from './types';
import { StubWalletProvider } from './stub-provider';

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

/**
 * The contract every wallet provider must implement. The seam is
 * intentionally narrow — providers only handle pass building; issuance
 * bookkeeping (wallet_passes rows, revocation) lives in the app routes.
 */
export interface WalletProvider {
  /** Provider name (for logging/audit). */
  readonly name: string;

  buildApplePass(ticket: WalletTicket): Promise<PassArtifact>;

  buildGoogleSaveUrl(ticket: WalletTicket): Promise<GoogleSaveLink>;

  /** Which platforms this provider can serve (stub: both, as placeholders). */
  supports(platform: WalletPlatform): boolean;
}

// Re-export consumer types so callers import from the package root.
export type { GoogleSaveLink, PassArtifact, WalletPlatform, WalletTicket };

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let _provider: WalletProvider | null = null;

/**
 * Returns the configured wallet provider. Default is 'stub' (no keys needed).
 * Live provider names are accepted ONLY once implemented — selecting an
 * unknown/unimplemented provider throws instead of falling back.
 */
export function getWalletProvider(): WalletProvider {
  if (_provider) return _provider;

  const providerName = (process.env.WALLET_PROVIDER ?? 'stub').toLowerCase();

  switch (providerName) {
    case 'stub': {
      _provider = new StubWalletProvider();
      return _provider;
    }
    case 'apple':
    case 'google': {
      // Live providers are intentionally NOT implemented in V2.0 (no real
      // Apple/Google credentials may ship — package constraint). Throw loud.
      throw new Error(
        `[WalletProvider] WALLET_PROVIDER=${providerName} is not implemented yet. ` +
          'Apple/Google credentials are not configured in V2.0 — switch back to WALLET_PROVIDER=stub.'
      );
    }
    default:
      throw new Error(
        `[WalletProvider] Unknown WALLET_PROVIDER "${providerName}". ` +
          "Supported values: 'stub' (live providers arrive post-V2.0)."
      );
  }
}

/** Test/reset hook — clears the cached provider singleton. */
export function resetWalletProvider(): void {
  _provider = null;
}
