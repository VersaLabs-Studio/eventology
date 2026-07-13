// ============================================================================
// Expo Push Provider
// ============================================================================
// Expo Push (https://docs.expo.dev/push-notifications/send-notifications/) —
// V1.5 push provider. Expo's push endpoint is KEYLESS for standard sends, so
// unlike email/SMS this channel is live by default; set EXPO_PUSH_LIVE=false
// to fall back to the deferred log-only behaviour.
// ============================================================================

import type {
  NotificationChannelProvider,
  ChannelAddress,
  ChannelSendResult,
  RenderedContent,
} from './provider';

export interface ExpoPushConfig {
  /** Optional access token from Expo; the endpoint also accepts anonymous sends in dev */
  accessToken?: string;
}

interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushResponse {
  data: ExpoPushTicket[];
}

export class ExpoPushProvider implements NotificationChannelProvider {
  readonly channel = 'push' as const;
  private readonly config: ExpoPushConfig;

  constructor(config: ExpoPushConfig = {}) {
    this.config = config;
  }

  async send(
    address: ChannelAddress,
    content: RenderedContent
  ): Promise<ChannelSendResult> {
    const tokens = address.pushTokens ?? [];
    if (tokens.length === 0) {
      return {
        success: false,
        error: 'ExpoPush requires at least one push token',
        providerName: 'expo_push',
      };
    }

    try {
      if (process.env.EXPO_PUSH_LIVE === 'false') {
        console.log(
          `[ExpoPushProvider:DEFERRED] to=${tokens.length} token(s) title="${content.subject}"`
        );
        return {
          success: true,
          providerRef: `expo_deferred_${Date.now()}`,
          providerName: 'expo_push',
        };
      }

      // Expo accepts up to 100 messages per request.
      const CHUNK = 100;
      const tickets: ExpoPushTicket[] = [];
      for (let i = 0; i < tokens.length; i += CHUNK) {
        const chunk = tokens.slice(i, i + CHUNK);
        const messages: ExpoPushMessage[] = chunk.map((to) => ({
          to,
          title: content.subject,
          body: content.textBody,
          sound: 'default',
          ...(content.metadata ? { data: content.metadata } : {}),
        }));

        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(this.config.accessToken
              ? { Authorization: `Bearer ${this.config.accessToken}` }
              : {}),
          },
          body: JSON.stringify(messages),
        });

        if (!res.ok) {
          return {
            success: false,
            error: `Expo push endpoint returned ${res.status}`,
            providerName: 'expo_push',
          };
        }

        const parsed = (await res.json()) as ExpoPushResponse;
        tickets.push(...(parsed.data ?? []));
      }

      const errored = tickets.filter((t) => t.status === 'error');
      if (errored.length > 0) {
        // Stale tokens surface as DeviceNotRegistered tickets — log, don't
        // fail the whole send when at least one ticket was accepted.
        console.warn(
          `[ExpoPushProvider] ${errored.length}/${tickets.length} ticket error(s): ` +
            errored.map((t) => t.details?.error ?? t.message ?? 'unknown').join(', ')
        );
      }
      const okTicket = tickets.find((t) => t.status === 'ok');
      if (!okTicket) {
        return {
          success: false,
          error: errored[0]?.details?.error ?? errored[0]?.message ?? 'All push tickets errored',
          providerName: 'expo_push',
        };
      }

      return {
        success: true,
        providerRef: okTicket.id ?? `expo_${Date.now()}`,
        providerName: 'expo_push',
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown ExpoPush error',
        providerName: 'expo_push',
      };
    }
  }
}
