// ============================================================================
// Stub Channel Provider
// ============================================================================
// Default provider for every channel. Logs the send + returns a synthetic
// provider_ref so the delivery row has something to record. NEVER hits
// any external API. The default at factory time so missing keys are fine.
// ============================================================================

import type {
  NotificationChannelProvider,
  ChannelAddress,
  ChannelSendResult,
  RenderedContent,
} from './provider';
import type { NotificationChannel } from '@eventology/schemas';

export class StubChannelProvider implements NotificationChannelProvider {
  readonly channel: NotificationChannel;

  constructor(channel: NotificationChannel) {
    this.channel = channel;
  }

  async send(
    address: ChannelAddress,
    content: RenderedContent
  ): Promise<ChannelSendResult> {
    // Log only — no network, no cost. Includes the destination and a
    // truncated subject so debugging template rendering is straightforward.
    const dest =
      address.email ?? address.phone ??
      (address.pushTokens && address.pushTokens.length > 0
        ? `push[${address.pushTokens.length}]`
        : 'unknown');
    console.log(
      `[StubChannel:${this.channel}] → ${dest} | subject="${content.subject}"`
    );

    return {
      success: true,
      providerRef: `stub_${this.channel}_${Date.now()}`,
      providerName: 'stub',
    };
  }
}
