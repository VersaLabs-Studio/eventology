// ============================================================================
// Payment Provider Factory
// ============================================================================
// Returns the configured payment provider based on environment.
// Default: StubPaymentProvider (dev). Swap for ChapaProvider in production.
// ============================================================================

import type { PaymentProvider } from './provider';
import { StubPaymentProvider } from './stub-provider';
import { ChapaProvider } from './chapa-provider';

let _provider: PaymentProvider | null = null;

/**
 * Returns the configured payment provider.
 * Uses environment variable PAYMENT_PROVIDER to determine which provider to use.
 * Default: 'stub' (dev mode)
 *
 * Throws explicit error if PAYMENT_PROVIDER=chapa but env vars are missing.
 * Misconfig must be obvious — no silent fallback.
 */
export function getPaymentProvider(): PaymentProvider {
  if (_provider) return _provider;

  const providerName = process.env.PAYMENT_PROVIDER ?? 'stub';

  switch (providerName) {
    case 'stub':
      _provider = new StubPaymentProvider();
      break;
    case 'chapa': {
      const secretKey = process.env.CHAPA_SECRET_KEY;
      const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;
      if (!secretKey || !webhookSecret) {
        throw new Error(
          '[PaymentProvider] PAYMENT_PROVIDER=chapa but CHAPA_SECRET_KEY ' +
          'and/or CHAPA_WEBHOOK_SECRET are not set. ' +
          'Set both env vars or switch back to PAYMENT_PROVIDER=stub.'
        );
      }
      _provider = new ChapaProvider({ secretKey, webhookSecret });
      break;
    }
    default:
      console.warn(`[PaymentProvider] Unknown provider "${providerName}", falling back to stub`);
      _provider = new StubPaymentProvider();
  }

  return _provider;
}
