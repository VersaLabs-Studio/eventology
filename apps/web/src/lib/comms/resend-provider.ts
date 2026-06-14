// ============================================================================
// Resend Email Provider
// ============================================================================
// Resend (https://resend.com) — V1 email provider. Config-deferred:
// selecting this provider without env keys throws a LOUD error at
// factory-time, mirroring the payments factory guard. Send logic is
// typed against the public Resend API surface but the live HTTP call
// is left to the operator to enable (per the config-deferred rule).
// ============================================================================

import type {
  NotificationChannelProvider,
  ChannelAddress,
  ChannelSendResult,
  RenderedContent,
} from './provider';

export interface ResendConfig {
  apiKey: string;
  fromAddress: string;
  fromName?: string;
}

interface ResendSendRequest {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
  reply_to?: string;
  tags?: { name: string; value: string }[];
}

interface ResendSendResponse {
  id: string;
}

export class ResendProvider implements NotificationChannelProvider {
  readonly channel = 'email' as const;
  private readonly config: ResendConfig;

  constructor(config: ResendConfig) {
    this.config = config;
  }

  async send(
    address: ChannelAddress,
    content: RenderedContent
  ): Promise<ChannelSendResult> {
    if (!address.email) {
      return {
        success: false,
        error: 'Resend requires an email address',
        providerName: 'resend',
      };
    }

    const payload: ResendSendRequest = {
      from: this.config.fromName
        ? `${this.config.fromName} <${this.config.fromAddress}>`
        : this.config.fromAddress,
      to: [address.email],
      subject: content.subject,
      text: content.textBody,
      ...(content.htmlBody ? { html: content.htmlBody } : {}),
    };

    try {
      // The HTTP call is intentionally left as a documented block —
      // uncomment + wire process.env.RESEND_API_KEY into config when
      // going live. The payload is fully typed against the Resend API
      // so flipping this on is a 5-line change.
      //
      // const res = await fetch('https://api.resend.com/emails', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.config.apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(payload),
      // });
      // if (!res.ok) {
      //   const errText = await res.text();
      //   return { success: false, error: `Resend ${res.status}: ${errText}`, providerName: 'resend' };
      // }
      // const data = (await res.json()) as ResendSendResponse;
      // return { success: true, providerRef: data.id, providerName: 'resend' };

      // Config-deferred: log the payload, return synthetic success when
      // RESEND_LIVE is unset (the env guard prevents live calls).
      if (process.env.RESEND_LIVE !== 'true') {
        console.log(
          `[ResendProvider:DEFERRED] from=${payload.from} to=${payload.to[0]} subject="${payload.subject}"`
        );
        return {
          success: true,
          providerRef: `resend_deferred_${Date.now()}`,
          providerName: 'resend',
        };
      }

      // Live path: implementer must wire the HTTP call. The shape above
      // shows the expected request/response. The block returns
      // unreachable here in the deferred case.
      return {
        success: false,
        error: 'ResendProvider: live HTTP call not wired in this build',
        providerName: 'resend',
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown Resend error',
        providerName: 'resend',
      };
    }
  }
}
