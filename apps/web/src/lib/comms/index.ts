// ============================================================================
// Channel Provider Factory
// ============================================================================
// Returns the configured provider for a channel. Mirrors the
// payments-factory pattern: default = stub (dev), and selecting a
// real provider without its keys throws a LOUD config error at
// factory time. No silent fallback.
// ============================================================================

import type { NotificationChannel } from '@eventology/schemas';
import type { NotificationChannelProvider } from './provider';
import { StubChannelProvider } from './stub-provider';
import { ResendProvider, type ResendConfig } from './resend-provider';
import {
  AfricasTalkingProvider,
  type AfricasTalkingConfig,
} from './africas-talking-provider';
import { ExpoPushProvider, type ExpoPushConfig } from './expo-push-provider';

const stubCache: Partial<Record<NotificationChannel, NotificationChannelProvider>> = {};

/**
 * Returns the configured channel provider for a given channel.
 *
 * Selection is keyed off three independent env vars (one per channel):
 *   - EMAIL_PROVIDER  = 'stub' | 'resend'  (default 'stub')
 *   - SMS_PROVIDER    = 'stub' | 'africas_talking'  (default 'stub')
 *   - PUSH_PROVIDER   = 'stub' | 'expo_push'  (default 'expo_push' — keyless)
 *
 * If a real provider is selected without its env keys, throws a clear
 * config error. Misconfig must be obvious — no silent fallback to stub.
 */
export function getChannelProvider(
  channel: NotificationChannel
): NotificationChannelProvider {
  switch (channel) {
    case 'email': {
      const providerName = (process.env.EMAIL_PROVIDER ?? 'stub').toLowerCase();
      if (providerName === 'stub') {
        return (stubCache.email ??= new StubChannelProvider('email'));
      }
      if (providerName === 'resend') {
        const apiKey = process.env.RESEND_API_KEY;
        const fromAddress = process.env.RESEND_FROM_ADDRESS;
        if (!apiKey || !fromAddress) {
          throw new Error(
            '[ChannelProvider] EMAIL_PROVIDER=resend but RESEND_API_KEY and/or ' +
            'RESEND_FROM_ADDRESS are not set. Set both env vars or switch back to EMAIL_PROVIDER=stub.'
          );
        }
        const config: ResendConfig = {
          apiKey,
          fromAddress,
          ...(process.env.RESEND_FROM_NAME
            ? { fromName: process.env.RESEND_FROM_NAME }
            : {}),
        };
        return new ResendProvider(config);
      }
      console.warn(
        `[ChannelProvider] Unknown EMAIL_PROVIDER "${providerName}", falling back to stub`
      );
      return (stubCache.email ??= new StubChannelProvider('email'));
    }
    case 'sms': {
      const providerName = (process.env.SMS_PROVIDER ?? 'stub').toLowerCase();
      if (providerName === 'stub') {
        return (stubCache.sms ??= new StubChannelProvider('sms'));
      }
      if (providerName === 'africas_talking') {
        const apiKey = process.env.AFRICAS_TALKING_API_KEY;
        const username = process.env.AFRICAS_TALKING_USERNAME;
        if (!apiKey || !username) {
          throw new Error(
            '[ChannelProvider] SMS_PROVIDER=africas_talking but AFRICAS_TALKING_API_KEY ' +
            'and/or AFRICAS_TALKING_USERNAME are not set. Set both env vars or switch back to SMS_PROVIDER=stub.'
          );
        }
        const config: AfricasTalkingConfig = {
          apiKey,
          username,
          ...(process.env.AFRICAS_TALKING_SENDER_ID
            ? { senderId: process.env.AFRICAS_TALKING_SENDER_ID }
            : {}),
        };
        return new AfricasTalkingProvider(config);
      }
      console.warn(
        `[ChannelProvider] Unknown SMS_PROVIDER "${providerName}", falling back to stub`
      );
      return (stubCache.sms ??= new StubChannelProvider('sms'));
    }
    case 'push': {
      // Expo push is keyless, so unlike email/SMS the real provider is the
      // default; PUSH_PROVIDER=stub still opts out.
      const providerName = (process.env.PUSH_PROVIDER ?? 'expo_push').toLowerCase();
      if (providerName === 'stub') {
        return (stubCache.push ??= new StubChannelProvider('push'));
      }
      if (providerName === 'expo_push') {
        const config: ExpoPushConfig = process.env.EXPO_ACCESS_TOKEN
          ? { accessToken: process.env.EXPO_ACCESS_TOKEN }
          : {};
        return new ExpoPushProvider(config);
      }
      console.warn(
        `[ChannelProvider] Unknown PUSH_PROVIDER "${providerName}", falling back to stub`
      );
      return (stubCache.push ??= new StubChannelProvider('push'));
    }
  }
}
