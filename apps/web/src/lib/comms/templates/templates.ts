// ============================================================================
// Comms Templates
// ============================================================================
// Typed template inputs for each domain event. Each template returns
// a per-channel rendered content map (subject, email body, SMS body, etc).
// Uses packages/locales COMMS catalog for en/am strings. No hardcoded
// user-facing strings.
// ============================================================================

import type {
  CommsTemplateKey,
  Locale,
  CommsCatalog,
} from '@eventology/locales';
import { DEFAULT_LOCALE, getCommsCatalog } from '@eventology/locales';
import { COMMS_DEFAULT_SENDER_NAME } from '@eventology/config';
import type { RenderedContent } from '../provider';

// ---------------------------------------------------------------------------
// Per-template input shapes
// ---------------------------------------------------------------------------

export interface RegistrationConfirmedInput {
  name: string;
  event: string;
  eventDate: string;
  venue: string;
  ticketNumber: string;
  ticketUrl: string;
}

export interface TicketIssuedInput {
  name: string;
  event: string;
  ticketNumber: string;
  ticketUrl: string;
}

export interface PaymentCompletedInput {
  name: string;
  event: string;
  amount: string;
  currency: string;
  receiptUrl: string;
}

export interface RefundProcessedInput {
  name: string;
  event: string;
  amount: string;
  currency: string;
  reason: string;
}

export interface PayoutUpdateInput {
  name: string;
  amount: string;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference: string;
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

/**
 * Substitutes {{var}} placeholders in a template string.
 * Unknown placeholders are left as-is so the dev can spot missing data.
 */
function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in vars ? vars[key] : match
  );
}

/**
 * Builds a per-channel rendered map for a given template + locale + vars.
 * Returns the subject + a single textBody (used for SMS and push); for
 * email the rendered HTML is also produced via a minimal text-to-HTML
 * transform (newlines → <br/>, paragraphs → <p>).
 */
function render(
  template: CommsTemplateKey,
  locale: Locale,
  vars: Record<string, string>
): { subject: string; inAppTitle: string; textBody: string; htmlBody: string } {
  const catalog: CommsCatalog = getCommsCatalog(locale);
  const entry = catalog[template];

  const subject = substitute(entry.subject, vars);
  const textBody = substitute(entry.emailBody, vars);
  const inAppTitle = substitute(entry.inAppTitle, vars);

  // Minimal text → HTML transform: paragraphs split on blank lines,
  // single newlines become <br/>. Sufficient for the stub path; a real
  // React Email renderer can replace this when live.
  const htmlBody = textBody
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px 0;line-height:1.55;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');

  return { subject, inAppTitle, textBody, htmlBody };
}

// ---------------------------------------------------------------------------
// Per-template content renderers
// ---------------------------------------------------------------------------

export function renderRegistrationConfirmed(
  locale: Locale,
  input: RegistrationConfirmedInput
): { subject: string; inAppTitle: string; textBody: string; htmlBody: string } {
  return render('registrationConfirmed', locale, {
    name: input.name,
    event: input.event,
    eventDate: input.eventDate,
    venue: input.venue,
    ticketNumber: input.ticketNumber,
    ticketUrl: input.ticketUrl,
  });
}

export function renderTicketIssued(
  locale: Locale,
  input: TicketIssuedInput
): { subject: string; inAppTitle: string; textBody: string; htmlBody: string } {
  return render('ticketIssued', locale, {
    name: input.name,
    event: input.event,
    ticketNumber: input.ticketNumber,
    ticketUrl: input.ticketUrl,
  });
}

export function renderPaymentCompleted(
  locale: Locale,
  input: PaymentCompletedInput
): { subject: string; inAppTitle: string; textBody: string; htmlBody: string } {
  return render('paymentCompleted', locale, {
    name: input.name,
    event: input.event,
    amount: input.amount,
    currency: input.currency,
    receiptUrl: input.receiptUrl,
  });
}

export function renderRefundProcessed(
  locale: Locale,
  input: RefundProcessedInput
): { subject: string; inAppTitle: string; textBody: string; htmlBody: string } {
  return render('refundProcessed', locale, {
    name: input.name,
    event: input.event,
    amount: input.amount,
    currency: input.currency,
    reason: input.reason,
  });
}

export function renderPayoutUpdate(
  locale: Locale,
  input: PayoutUpdateInput
): { subject: string; inAppTitle: string; textBody: string; htmlBody: string } {
  return render('payoutUpdate', locale, {
    name: input.name,
    amount: input.amount,
    currency: input.currency,
    status: input.status,
    reference: input.reference,
  });
}

// ---------------------------------------------------------------------------
// Per-channel projection
// ---------------------------------------------------------------------------

/**
 * Projects a rendered (subject/inAppTitle/textBody/htmlBody) tuple into
 * a per-channel RenderedContent map. SMS / push strip HTML and prefer
 * the shortest body. Email uses the HTML body when present.
 */
export function projectChannels(
  rendered: { subject: string; inAppTitle: string; textBody: string; htmlBody: string },
  defaultSenderName: string = COMMS_DEFAULT_SENDER_NAME
): {
  email: RenderedContent;
  sms: RenderedContent;
  push: RenderedContent;
  inApp: { title: string; body: string };
} {
  const emailContent: RenderedContent = {
    subject: rendered.subject,
    textBody: rendered.textBody,
    htmlBody: `<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#1D1D1F;">
<p style="font-size:14px;color:#86868B;margin:0 0 20px 0;">${defaultSenderName}</p>
${rendered.htmlBody}
<p style="font-size:12px;color:#86868B;margin:24px 0 0 0;">© ${new Date().getFullYear()} ${defaultSenderName}</p>
</div>`,
  };

  // SMS: keep under 160 chars; first line only.
  const smsFirstLine = rendered.textBody.split('\n')[0]?.slice(0, 160) ?? '';
  const smsContent: RenderedContent = {
    subject: smsFirstLine.slice(0, 60),
    textBody: smsFirstLine,
  };

  // Push: short title + body (Expo truncates long bodies anyway).
  const pushContent: RenderedContent = {
    subject: rendered.inAppTitle,
    textBody: rendered.textBody.split('\n')[0]?.slice(0, 120) ?? '',
    metadata: { deepLink: '/my-events' },
  };

  return {
    email: emailContent,
    sms: smsContent,
    push: pushContent,
    inApp: { title: rendered.inAppTitle, body: rendered.textBody.split('\n')[0] ?? '' },
  };
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_COMMS_LOCALE: Locale = DEFAULT_LOCALE;
