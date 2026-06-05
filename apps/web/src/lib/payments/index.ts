// ============================================================================
// Payment Provider Factory
// ============================================================================
// Returns the configured payment provider based on environment.
// Default: StubPaymentProvider (dev). Swap for ChapaProvider in production.
// ============================================================================

import type { PaymentProvider } from './provider';
import { StubPaymentProvider } from './stub-provider';

// TODO Phase 3: ChapaProvider
// import { ChapaProvider } from './chapa-provider';

let _provider: PaymentProvider | null = null;

/**
 * Returns the configured payment provider.
 * Uses environment variable PAYMENT_PROVIDER to determine which provider to use.
 * Default: 'stub' (dev mode)
 */
export function getPaymentProvider(): PaymentProvider {
  if (_provider) return _provider;

  const providerName = process.env.PAYMENT_PROVIDER ?? 'stub';

  switch (providerName) {
    case 'stub':
      _provider = new StubPaymentProvider();
      break;
    // TODO Phase 3: ChapaProvider
    // case 'chapa':
    //   _provider = new ChapaProvider({
    //     secretKey: process.env.CHAPA_SECRET_KEY!,
    //     webhookSecret: process.env.CHAPA_WEBHOOK_SECRET!,
    //   });
    //   break;
    default:
      console.warn(`[PaymentProvider] Unknown provider "${providerName}", falling back to stub`);
      _provider = new StubPaymentProvider();
  }

  return _provider;
}
