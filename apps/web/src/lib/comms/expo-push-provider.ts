// ============================================================================
// Expo Push Provider
// ============================================================================
// Expo Push (https://docs.expo.dev/push-notifications/send-notifications/) —
// V1 push provider. Config-deferred; web won't write tokens this phase.
// Selection without env keys throws a LOUD error at factory-time.
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

    const payload: ExpoPushMessage = {
      to: tokens,
      title: content.subject,
      body: content.textBody,
      ...(content.metadata ? { data: content.metadata } : {}),
    };

    try {
      if (process.env.EXPO_PUSH_LIVE !== 'true') {
        console.log(
          `[ExpoPushProvider:DEFERRED] to=${tokens.length} token(s) title="${payload.title}"`
        );
        return {
          success: true,
          providerRef: `expo_deferred_${Date.now()}`,
          providerName: 'expo_push',
        };
      }

      return {
        success: false,
        error: 'ExpoPushProvider: live HTTP call not wired in this build',
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
