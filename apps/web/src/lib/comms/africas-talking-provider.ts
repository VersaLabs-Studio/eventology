// ============================================================================
// Africa's Talking SMS Provider
// ============================================================================
// Africa's Talking (https://africastalking.com) — V1 SMS provider for
// Ethiopia. Config-deferred; the live HTTP call is left to be enabled
// by the operator. Selection without env keys throws a LOUD error at
// factory-time.
// ============================================================================

import type {
  NotificationChannelProvider,
  ChannelAddress,
  ChannelSendResult,
  RenderedContent,
} from './provider';

export interface AfricasTalkingConfig {
  apiKey: string;
  username: string;
  senderId?: string;
}

interface AfricasTalkingSendRequest {
  username: string;
  to: string;
  message: string;
  from?: string;
}

interface AfricasTalkingSendResponse {
  SMSMessageData: {
    Message: string;
    Recipients: Array<{
      statusCode: number;
      number: string;
      cost: string;
      messageId: string;
      status: string;
    }>;
  };
}

export class AfricasTalkingProvider implements NotificationChannelProvider {
  readonly channel = 'sms' as const;
  private readonly config: AfricasTalkingConfig;

  constructor(config: AfricasTalkingConfig) {
    this.config = config;
  }

  async send(
    address: ChannelAddress,
    content: RenderedContent
  ): Promise<ChannelSendResult> {
    if (!address.phone) {
      return {
        success: false,
        error: 'AfricasTalking requires a phone number',
        providerName: 'africas_talking',
      };
    }

    const payload: AfricasTalkingSendRequest = {
      username: this.config.username,
      to: address.phone,
      message: content.textBody,
      ...(this.config.senderId ? { from: this.config.senderId } : {}),
    };

    try {
      if (process.env.AFRICAS_TALKING_LIVE !== 'true') {
        console.log(
          `[AfricasTalkingProvider:DEFERRED] to=${payload.to} body="${payload.message.slice(0, 80)}"`
        );
        return {
          success: true,
          providerRef: `at_deferred_${Date.now()}`,
          providerName: 'africas_talking',
        };
      }

      return {
        success: false,
        error: 'AfricasTalkingProvider: live HTTP call not wired in this build',
        providerName: 'africas_talking',
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown AT error',
        providerName: 'africas_talking',
      };
    }
  }
}
