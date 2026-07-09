// ============================================================================
// notify() — Single Entry Point for Outbound Notifications
// ============================================================================
// Orchestrates the full delivery pipeline:
//   1. Resolves the user's notification_preferences (channel toggles + locale).
//   2. Writes the in-app `notifications` row (always — even if all channels
//      are disabled, the in-app row exists for the bell/dropdown UI).
//   3. Renders the localized template per channel (COMM-004).
//   4. Dispatches via the channel provider, recording a
//      `notification_deliveries` row per channel.
//   5. Idempotent / dedup-safe via (user_id, type, reference_id) — repeat
//      calls return the existing notification without re-sending.
//   6. Failures on one channel do not block others or the in-app row.
//      Errors land on the delivery row's `error` column, not thrown.
//
// All DB writes are best-effort: the financial/registration path that
// triggered this call must never fail because a notification failed.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  NotificationType,
  NotificationChannel,
  SupportedLocale,
} from '@eventology/schemas';
import { DEFAULT_LOCALE, type Locale } from '@eventology/locales';
import { getChannelProvider } from './index';
import type { ChannelAddress } from './provider';
import {
  projectChannels,
  type RegistrationConfirmedInput,
  type TicketIssuedInput,
  type PaymentCompletedInput,
  type RefundProcessedInput,
  type PayoutUpdateInput,
  renderRegistrationConfirmed,
  renderTicketIssued,
  renderPaymentCompleted,
  renderRefundProcessed,
  renderPayoutUpdate,
} from './templates/templates';

export interface NotifyInput {
  /** Recipient's profile UUID */
  userId: string;
  /** Notification type — drives the in-app row type */
  type: NotificationType;
  /** Optional reference for deep-linking + dedup (e.g. registration UUID) */
  referenceType?: string;
  referenceId?: string;
  /** Action URL for the in-app row (e.g. ticket URL) */
  actionUrl?: string;
  /** Per-channel addresses — at least one is required for delivery */
  address: ChannelAddress;
  /**
   * Pre-resolved channel toggles from notification_preferences.
   * If omitted, defaults to: email=true, sms=false, push=true.
   */
  channelPrefs?: { email: boolean; sms: boolean; push: boolean };
  /**
   * Locale for the recipient (resolved from preferences).
   * Defaults to DEFAULT_LOCALE ('en').
   */
  locale?: SupportedLocale;
  /**
   * Per-template input. The dispatcher picks the right one based on `type`.
   * Unused if the caller has already pre-rendered content (see below).
   */
  templateInput: TemplateInputs;
  /** Extra metadata persisted on the in-app row */
  metadata?: Record<string, unknown>;
}

export type TemplateInputs =
  | { kind: 'registration_confirmed'; data: RegistrationConfirmedInput }
  | { kind: 'event_reminder'; data: { name: string; event: string; time: string } }
  | { kind: 'event_cancelled'; data: { event: string } }
  | { kind: 'event_approved'; data: { event: string } }
  | { kind: 'event_rejected'; data: { event: string } }
  | { kind: 'new_registration'; data: { name: string; event: string } }
  | { kind: 'payment_received'; data: { amount: string; event: string } }
  | { kind: 'message_received'; data: { sender: string } }
  | { kind: 'system_announcement'; data: { title: string; body: string } }
  | { kind: 'ticket_issued'; data: TicketIssuedInput }
  | { kind: 'payment_completed'; data: PaymentCompletedInput }
  | { kind: 'refund_processed'; data: RefundProcessedInput }
  | { kind: 'payout_update'; data: PayoutUpdateInput };

export interface NotifyResult {
  /** Whether the in-app row was created (false only on hard DB error) */
  success: boolean;
  /** The notification UUID (null on hard error) */
  notificationId?: string;
  /** Per-channel delivery outcomes */
  deliveries: Array<{
    channel: NotificationChannel;
    status: 'sent' | 'failed' | 'skipped';
    providerRef?: string;
    error?: string;
  }>;
  /** The error message if success is false */
  error?: string;
}

/**
 * Resolves the channel-toggle preferences. Defaults: email=true,
 * sms=false, push=true (transactional-by-default, marketing-off).
 */
function resolveChannelPrefs(
  prefs: { email_enabled: boolean; sms_enabled: boolean; push_enabled: boolean }
): { email: boolean; sms: boolean; push: boolean } {
  return {
    email: prefs.email_enabled,
    sms: prefs.sms_enabled,
    push: prefs.push_enabled,
  };
}

/**
 * Renders the template into the (subject/inAppTitle/textBody/htmlBody)
 * tuple used by the projectChannels helper. Pure — no DB or network.
 */
function renderForTemplate(
  templateInput: TemplateInputs,
  locale: Locale
): { subject: string; inAppTitle: string; textBody: string; htmlBody: string } {
  switch (templateInput.kind) {
    case 'registration_confirmed':
      return renderRegistrationConfirmed(locale, templateInput.data);
    case 'payment_completed':
      return renderPaymentCompleted(locale, templateInput.data);
    case 'refund_processed':
      return renderRefundProcessed(locale, templateInput.data);
    case 'payout_update':
      return renderPayoutUpdate(locale, templateInput.data);
    case 'ticket_issued':
      return renderTicketIssued(locale, templateInput.data);
    case 'system_announcement':
      // Structured { title, body } — render as a proper in-app message,
      // never as raw JSON (that leaked into the bell UI previously).
      return {
        subject: templateInput.data.title,
        inAppTitle: templateInput.data.title,
        textBody: templateInput.data.body,
        htmlBody: `<p>${templateInput.data.body}</p>`,
      };
    default: {
      // Other structured payloads — render a human-readable message from
      // the string fields instead of dumping JSON.
      const d = templateInput.data as Record<string, unknown>;
      const title =
        typeof d.title === 'string' ? d.title : prettifyKind(templateInput.kind);
      const body =
        typeof d.body === 'string'
          ? d.body
          : Object.values(d)
              .filter((v): v is string => typeof v === 'string')
              .join(' — ');
      return {
        subject: title,
        inAppTitle: title,
        textBody: body,
        htmlBody: `<p>${body}</p>`,
      };
    }
  }
}

/** Turns a template kind like 'event_approved' into a readable label. */
function prettifyKind(kind: string): string {
  return kind
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Single entry point for all outbound notifications.
 *
 * Service-role justified: this is a system-side send called from payment
 * confirmations, refunds, payouts, etc — flows where RLS can't express
 * the orchestration (cross-channel fan-out + provider calls + writes
 * across notifications + notification_deliveries).
 *
 * Best-effort: never throws. Returns NotifyResult so the caller can log
 * the outcome without breaking the financial/registration flow.
 */
export async function notify(
  supabase: SupabaseClient,
  input: NotifyInput
): Promise<NotifyResult> {
  const locale: Locale = (input.locale ?? DEFAULT_LOCALE) as Locale;
  const channelPrefs = input.channelPrefs ?? { email: true, sms: false, push: true };

  // 1. Idempotency: check for an existing notification with the same
  // (user, type, reference). If one exists, return it without re-sending.
  if (input.referenceId) {
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', input.userId)
      .eq('type', input.type)
      .eq('reference_id', input.referenceId)
      .maybeSingle();

    if (existing) {
      return {
        success: true,
        notificationId: existing.id,
        deliveries: [],
      };
    }
  }

  // 2. Render content once, project to per-channel shapes.
  const rendered = renderForTemplate(input.templateInput, locale);
  const channels = projectChannels(rendered);

  // 3. Write the in-app row FIRST. The in-app notification is the
  // authoritative record — channel sends are best-effort.
  const { data: notification, error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: input.userId,
      type: input.type,
      title: channels.inApp.title,
      message: channels.inApp.body,
      action_url: input.actionUrl ?? null,
      reference_type: input.referenceType ?? null,
      reference_id: input.referenceId ?? null,
      metadata: input.metadata ?? {},
    })
    .select('id')
    .single();

  if (notifError || !notification) {
    return {
      success: false,
      error: notifError?.message ?? 'Failed to write notification',
      deliveries: [],
    };
  }

  const notificationId = notification.id;

  // 4. Fan out per channel. Each channel is independent — one failure
  // does not stop the others.
  const deliveries: NotifyResult['deliveries'] = [];

  // Email
  if (channelPrefs.email && input.address.email) {
    const result = await dispatch(supabase, notificationId, 'email', input.address, channels.email);
    deliveries.push({ channel: 'email', ...result });
  } else {
    await recordSkipped(supabase, notificationId, 'email');
    deliveries.push({ channel: 'email', status: 'skipped' });
  }

  // SMS
  if (channelPrefs.sms && input.address.phone) {
    const result = await dispatch(supabase, notificationId, 'sms', input.address, channels.sms);
    deliveries.push({ channel: 'sms', ...result });
  } else {
    await recordSkipped(supabase, notificationId, 'sms');
    deliveries.push({ channel: 'sms', status: 'skipped' });
  }

  // Push
  if (channelPrefs.push && input.address.pushTokens && input.address.pushTokens.length > 0) {
    const result = await dispatch(supabase, notificationId, 'push', input.address, channels.push);
    deliveries.push({ channel: 'push', ...result });
  } else {
    await recordSkipped(supabase, notificationId, 'push');
    deliveries.push({ channel: 'push', status: 'skipped' });
  }

  return {
    success: true,
    notificationId,
    deliveries,
  };
}

/**
 * Loads the user's notification_preferences row. Returns sensible
 * defaults if the row is missing.
 */
export async function loadUserPrefs(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  channelPrefs: { email: boolean; sms: boolean; push: boolean };
  locale: SupportedLocale;
}> {
  const { data } = await supabase
    .from('notification_preferences')
    .select('email_enabled, sms_enabled, push_enabled, locale')
    .eq('profile_id', userId)
    .maybeSingle();

  if (!data) {
    return {
      channelPrefs: { email: true, sms: false, push: true },
      locale: DEFAULT_LOCALE as SupportedLocale,
    };
  }

  return {
    channelPrefs: resolveChannelPrefs(data),
    locale: (data.locale as SupportedLocale) ?? (DEFAULT_LOCALE as SupportedLocale),
  };
}

/**
 * Loads the user's contact info from the profiles table — used as the
 * fallback destination addresses for channel sends.
 */
export async function loadUserAddress(
  supabase: SupabaseClient,
  userId: string
): Promise<ChannelAddress> {
  const { data } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', userId)
    .maybeSingle();

  return {
    ...(data?.email ? { email: data.email } : {}),
    ...(data?.phone ? { phone: data.phone } : {}),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function dispatch(
  supabase: SupabaseClient,
  notificationId: string,
  channel: NotificationChannel,
  address: ChannelAddress,
  content: import('./provider').RenderedContent
): Promise<{ status: 'sent' | 'failed'; providerRef?: string; error?: string }> {
  try {
    const provider = getChannelProvider(channel);
    const result = await provider.send(address, content);

    if (result.success) {
      await supabase.from('notification_deliveries').insert({
        notification_id: notificationId,
        channel,
        status: 'sent',
        provider: result.providerName,
        provider_ref: result.providerRef ?? null,
        sent_at: new Date().toISOString(),
        attempts: 1,
      });
      return { status: 'sent', providerRef: result.providerRef };
    }

    await supabase.from('notification_deliveries').insert({
      notification_id: notificationId,
      channel,
      status: 'failed',
      provider: result.providerName,
      error: result.error ?? 'Unknown provider error',
      attempts: 1,
    });
    return { status: 'failed', error: result.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown dispatch error';
    try {
      await supabase.from('notification_deliveries').insert({
        notification_id: notificationId,
        channel,
        status: 'failed',
        provider: 'unknown',
        error: message,
        attempts: 1,
      });
    } catch {
      // Best-effort — don't let delivery-row insert failure mask the original
    }
    return { status: 'failed', error: message };
  }
}

async function recordSkipped(
  supabase: SupabaseClient,
  notificationId: string,
  channel: NotificationChannel
): Promise<void> {
  try {
    await supabase.from('notification_deliveries').insert({
      notification_id: notificationId,
      channel,
      status: 'skipped',
      provider: null,
    });
  } catch {
    // Best-effort
  }
}
