# Eventology V1 MVP — Integration Specifications (Part 3 of 5)

> **Author:** Kidus Abdula — Lead SWE & Systems Architect
>
> **Version:** 1.0.0
>
> **Created:** May 25, 2026
>
> **Classification:** Master Source of Truth — Cross-Agent Session Handover
>
> **Status:** ✅ ARCHITECT APPROVED
>
> **Platform Identity:** AI-NATIVE LLM-POWERED EVENT MANAGEMENT SYSTEM

<!-- RECOVERY NOTE (2026-06-10): Restored verbatim from Kidus's Notion backup after the
docs/ master set was discarded. This part was captured complete. Notion export artifacts
(e.g. `Bearer${key}` missing a space, `$lng`/`$lat` SQL placeholders) are preserved as-is
— fix them at implementation time, not in this source-of-truth doc. -->

---

## Table of Contents

1. Payment Integration — Chapa
2. SMS Integration — Africa’s Talking
3. Email Integration — Resend
4. Push Notifications — Expo Push
5. AI Integration — OpenRouter
6. Internationalization (i18n)
7. Calendar Integration
8. Maps & Geolocation
9. Authentication — better-auth
10. File Storage — Supabase Storage

---

## 1. Payment Integration — Chapa

### 1.1 Overview

Chapa (https://chapa.co) is Ethiopia’s leading payment gateway. We integrate Chapa as the **PRIMARY and ONLY** payment provider for V1. Telebirr is deferred to V2.

### 1.2 Environment Setup

```
# .env.local
CHAPA_SECRET_KEY=CHASECK_TEST-xxxxxxxxxxxxxxxx   # Test mode key
CHAPA_WEBHOOK_SECRET=chapa_webhook_secret_xxxxx    # For verifying webhook signatures
NEXT_PUBLIC_APP_URL=https://eventology-nu.vercel.app
```

### 1.3 Payment Flow Architecture

```
┌──────────┐    ┌──────────────┐    ┌───────────┐    ┌──────────┐
│  Client   │───▶│ POST /api/   │───▶│  Chapa    │───▶│ Checkout │
│  (User)   │    │ payments/init│    │  Init API │    │  Page    │
└──────────┘    └──────────────┘    └───────────┘    └──────────┘
                       │                                    │
                       ▼                                    ▼
                ┌──────────────┐                    ┌──────────────┐
                │ Create       │                    │ User pays    │
                │ payment      │                    │ (card/mobile │
                │ record       │                    │  money)      │
                │ (pending)    │                    └──────────────┘
                └──────────────┘                           │
                                                           ▼
┌──────────┐    ┌──────────────┐    ┌───────────┐  ┌──────────────┐
│  Client   │◀──│ Success page │◀──│ Redirect  │◀─│ Chapa sends  │
│  (Ticket) │    │ /ticket/[id] │    │ callback  │  │ webhook      │
└──────────┘    └──────────────┘    └───────────┘  └──────────────┘
                                                          │
                                                          ▼
                                                   ┌──────────────┐
                                                   │ POST /api/   │
                                                   │ webhooks/    │
                                                   │ chapa        │
                                                   │              │
                                                   │ • Verify sig │
                                                   │ • Update pay │
                                                   │ • Create tkt │
                                                   │ • Send notif │
                                                   └──────────────┘
```

### 1.4 Chapa Client Wrapper

```tsx
// packages/utils/src/chapa.ts

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

interface ChapaInitPayload {
  amount: string;
  currency: 'ETB';
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  tx_ref: string;              // Unique transaction reference
  callback_url: string;        // Webhook URL
  return_url: string;          // Redirect after payment
  customization?: {
    title: string;
    description: string;
    logo: string;
  };
}

interface ChapaInitResponse {
  message: string;
  status: string;
  data: {
    checkout_url: string;
  };
}

interface ChapaVerifyResponse {
  message: string;
  status: string;
  data: {
    first_name: string;
    last_name: string;
    email: string;
    currency: string;
    amount: number;
    charge: number;
    mode: string;
    method: string;
    type: string;
    status: string;
    reference: string;
    tx_ref: string;
    created_at: string;
    updated_at: string;
  };
}

export class ChapaClient {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  async initialize(payload: ChapaInitPayload): Promise<ChapaInitResponse> {
    const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Chapa init failed: ${error.message}`);
    }

    return response.json();
  }

  async verify(txRef: string): Promise<ChapaVerifyResponse> {
    const response = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${txRef}`, {
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Chapa verify failed for tx_ref: ${txRef}`);
    }

    return response.json();
  }
}
```

### 1.5 Payment Initialization Endpoint

```tsx
// apps/web/src/app/api/protected/payments/init/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ChapaClient } from '@eventology/utils/chapa';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { eventId, ticketTierId, promoCode } = await req.json();

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  // 2. Get event, tier, and organizer details
  const { data: tier } = await supabase
    .from('ticket_tiers')
    .select('*, events(*, organizers(commission_rate))')
    .eq('id', ticketTierId)
    .single();

  if (!tier) return NextResponse.json({ error: { code: 'TIER_NOT_FOUND' } }, { status: 404 });

  // 3. Check capacity
  if (tier.sold_count >= tier.capacity) {
    return NextResponse.json({ error: { code: 'SOLD_OUT' } }, { status: 409 });
  }

  // 4. Apply promo code if provided
  let discount = 0;
  if (promoCode) {
    // Validate and calculate discount...
  }

  // 5. Calculate amounts
  const amount = Math.max(tier.price - discount, 0);
  const commissionRate = tier.events.organizers.commission_rate;
  const platformFee = amount * commissionRate / 100;
  const organizerAmount = amount - platformFee;

  // 6. Generate unique transaction reference
  const txRef = `EVT-${nanoid(12)}`;

  // 7. Create payment record (status: pending)
  const { data: payment } = await supabase.from('payments').insert({
    registration_id: null, // Will be set after registration
    profile_id: user.id,
    event_id: eventId,
    ticket_tier_id: ticketTierId,
    amount,
    platform_fee: platformFee,
    organizer_amount: organizerAmount,
    provider: 'chapa',
    provider_tx_ref: txRef,
    status: 'pending',
  }).select().single();

  // 8. Initialize Chapa payment
  const chapa = new ChapaClient(process.env.CHAPA_SECRET_KEY!);
  const chapaResponse = await chapa.initialize({
    amount: amount.toFixed(2),
    currency: 'ETB',
    email: user.email!,
    first_name: user.user_metadata.full_name?.split(' ')[0] || 'Attendee',
    last_name: user.user_metadata.full_name?.split(' ').slice(1).join(' ') || '',
    phone_number: user.phone || '',
    tx_ref: txRef,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/chapa`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?tx_ref=${txRef}`,
    customization: {
      title: tier.events.title,
      description: `${tier.name} ticket for ${tier.events.title}`,
      logo: 'https://eventology-nu.vercel.app/logo.png',
    },
  });

  return NextResponse.json({
    data: {
      checkoutUrl: chapaResponse.data.checkout_url,
      txRef,
      paymentId: payment.id,
    },
  });
}
```

### 1.6 Webhook Handler

```tsx
// apps/web/src/app/api/webhooks/chapa/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Use service role client for webhook (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();

  // 1. Verify webhook signature
  const signature = req.headers.get('x-chapa-signature');
  const hash = crypto
    .createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET!)
    .update(JSON.stringify(body))
    .digest('hex');

  if (signature !== hash) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const { tx_ref, status } = body;

  // 2. Idempotency check — skip if already processed
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('provider_tx_ref', tx_ref)
    .single();

  if (!existingPayment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  if (existingPayment.status === 'completed') {
    return NextResponse.json({ message: 'Already processed' }, { status: 200 });
  }

  // 3. Update payment status
  if (status === 'success') {
    await supabase.from('payments').update({
      status: 'completed',
      paid_at: new Date().toISOString(),
      provider_response: body,
    }).eq('provider_tx_ref', tx_ref);

    // 4. Create registration
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('provider_tx_ref', tx_ref)
      .single();

    const { data: registration } = await supabase.from('registrations').insert({
      event_id: payment.event_id,
      profile_id: payment.profile_id,
      ticket_tier_id: payment.ticket_tier_id,
      status: 'confirmed',
    }).select().single();

    // 5. Update payment with registration_id
    await supabase.from('payments').update({
      registration_id: registration.id,
    }).eq('id', payment.id);

    // 6. Create ticket
    const qrData = `EVT-${registration.id}-${crypto.randomUUID()}`;
    await supabase.from('tickets').insert({
      registration_id: registration.id,
      event_id: payment.event_id,
      profile_id: payment.profile_id,
      ticket_tier_id: payment.ticket_tier_id,
      qr_data: qrData,
      status: 'valid',
    });

    // 7. Update sold_count
    await supabase.rpc('increment_sold_count', {
      tier_id: payment.ticket_tier_id,
    });

    // 8. Send confirmation notifications (email + SMS + push)
    // Trigger Edge Functions for email and SMS
    await supabase.functions.invoke('send-email', {
      body: { type: 'registration_confirm', registrationId: registration.id },
    });
    await supabase.functions.invoke('send-sms', {
      body: { type: 'registration_confirm', registrationId: registration.id },
    });
  } else {
    await supabase.from('payments').update({
      status: 'failed',
      provider_response: body,
    }).eq('provider_tx_ref', tx_ref);
  }

  return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
}
```

### 1.7 Commission Calculation

```
ticket_price      = 1500.00 ETB
commission_rate    = 5.00%  (from organizer.commission_rate)
platform_fee      = 1500.00 * 0.05 = 75.00 ETB
organizer_amount   = 1500.00 - 75.00 = 1425.00 ETB
```

### 1.8 Testing Strategy

- Use Chapa test mode (`CHASECK_TEST-` prefix keys)
- Test card: `4200 0000 0000 0000` (any CVV, future expiry)
- Test mobile money: Use sandbox numbers from Chapa docs
- Verify webhook delivery using Chapa dashboard webhook logs
- Test idempotency by replaying the same webhook payload

---

## 2. SMS Integration — Africa’s Talking

### 2.1 Overview

Africa’s Talking provides reliable SMS delivery to Ethiopian phone numbers (+251). Primary provider; Afro Message as fallback.

### 2.2 Environment Setup

```
AT_API_KEY=atsk_xxxxxxxxxxxxxxxx
AT_USERNAME=eventology          # sandbox for testing, live username for production
AT_SENDER_ID=Eventology         # Registered sender ID
```

### 2.3 Phone Number Formatting

```tsx
// packages/utils/src/phone.ts

export function formatEthiopianPhone(phone: string): string {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Convert local format to international
  if (cleaned.startsWith('0')) {
    return `+251${cleaned.slice(1)}`;       // 09XXXXXXXX → +2519XXXXXXXX
  }
  if (cleaned.startsWith('251')) {
    return `+${cleaned}`;                    // 2519XXXXXXXX → +2519XXXXXXXX
  }
  if (cleaned.startsWith('+251')) {
    return cleaned;                          // Already international
  }

  throw new Error(`Invalid Ethiopian phone number: ${phone}`);
}
```

### 2.4 SMS Edge Function

```tsx
// supabase/functions/send-sms/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const AT_API_URL = 'https://api.africastalking.com/version1/messaging';
const AT_SANDBOX_URL = 'https://api.sandbox.africastalking.com/version1/messaging';

const SMS_TEMPLATES = {
  registration_confirm: (data: any) =>
    `✅ You're registered for ${data.eventName} on ${data.date}! Your ticket: ${data.ticketUrl}`,
  reminder_24h: (data: any) =>
    `📅 ${data.eventName} is TOMORROW at ${data.time}. Location: ${data.venue}. See you there!`,
  reminder_1h: (data: any) =>
    `⏰ ${data.eventName} starts in 1 HOUR at ${data.venue}. Your ticket: ${data.ticketUrl}`,
  waitlist_promoted: (data: any) =>
    `🎉 Great news! A spot opened up for ${data.eventName}. You're confirmed! Ticket: ${data.ticketUrl}`,
  payment_confirm: (data: any) =>
    `💰 Payment of ${data.amount} ETB received for ${data.eventName}. Ticket: ${data.ticketUrl}`,
};

serve(async (req) => {
  const { type, registrationId, phone, customMessage } = await req.json();

  // Build message from template or use custom message
  let message: string;
  if (customMessage) {
    message = customMessage;
  } else {
    // Fetch registration data to populate template...
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data } = await supabase
      .from('registrations')
      .select('*, events(*), tickets(*), profiles(*)')
      .eq('id', registrationId)
      .single();

    const templateData = {
      eventName: data.events.title,
      date: new Date(data.events.starts_at).toLocaleDateString('en-ET'),
      time: new Date(data.events.starts_at).toLocaleTimeString('en-ET'),
      venue: data.events.location_name,
      ticketUrl: `${Deno.env.get('APP_URL')}/ticket/${data.tickets?.[0]?.id}`,
      amount: data.payments?.[0]?.amount,
    };

    const templateFn = SMS_TEMPLATES[type as keyof typeof SMS_TEMPLATES];
    message = templateFn(templateData);
  }

  // Send via Africa's Talking
  const isProduction = Deno.env.get('AT_USERNAME') !== 'sandbox';
  const apiUrl = isProduction ? AT_API_URL : AT_SANDBOX_URL;

  const formData = new URLSearchParams({
    username: Deno.env.get('AT_USERNAME')!,
    to: phone || data.profiles.phone,
    message,
    from: Deno.env.get('AT_SENDER_ID') || '',
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'apiKey': Deno.env.get('AT_API_KEY')!,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: formData,
  });

  const result = await response.json();
  return new Response(JSON.stringify(result), { status: 200 });
});
```

### 2.5 Rate Limiting

- Max 3 SMS per event per user (registration confirm + 24h reminder + 1h reminder)
- Track in `notifications` table with `channel='sms'`
- If limit exceeded, skip SMS and rely on email + push

---

## 3. Email Integration — Resend

### 3.1 Overview

Resend (https://resend.com) for transactional emails with React Email templates.

### 3.2 Environment Setup

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=events@eventology.app    # Verified sending domain
```

### 3.3 Email Templates

Build with React Email (`@react-email/components`). Store in `packages/email-templates/src/`:

| Template | Trigger | Variables |
| --- | --- | --- |
| `registration-confirm.tsx` | Registration created | eventName, date, time, venue, tierName, qrCodeUrl, calendarLink |
| `reminder-24h.tsx` | 24h before event | eventName, date, time, venue, ticketUrl |
| `reminder-1h.tsx` | 1h before event | eventName, time, venue, ticketUrl |
| `payment-confirm.tsx` | Payment completed | eventName, amount, tierName, txRef, ticketUrl |
| `refund-processed.tsx` | Refund completed | eventName, refundAmount, originalAmount |
| `waitlist-promoted.tsx` | Waitlist promotion | eventName, tierName, ticketUrl |
| `event-approved.tsx` | Admin approves event | eventName, eventUrl (to organizer) |
| `event-rejected.tsx` | Admin rejects event | eventName, reason (to organizer) |
| `new-registration.tsx` | New registration | eventName, attendeeName, registrationCount (to organizer) |
| `daily-digest.tsx` | Daily cron | eventName, newRegistrations, totalRegistrations (to organizer) |
| `welcome.tsx` | User signup | userName |
| `password-reset.tsx` | Password reset request | resetUrl, userName |
| `event-pending.tsx` | Event submitted for review | eventName, organizerName (to admin) |

### 3.4 Edge Function Implementation

```tsx
// supabase/functions/send-email/index.ts

import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  const { type, registrationId, to, subject, data } = await req.json();

  // Build email HTML from React Email template (pre-rendered)
  // In production, templates are pre-compiled to HTML strings

  const emailMap = {
    registration_confirm: {
      subject: `✅ You're registered for ${data.eventName}!`,
      html: buildRegistrationConfirmHtml(data),
    },
    // ... other template mappings
  };

  const email = emailMap[type];

  const { data: result, error } = await resend.emails.send({
    from: 'Eventology <events@eventology.app>',
    to: [to],
    subject: email.subject,
    html: email.html,
  });

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify({ data: result }), { status: 200 });
});
```

---

## 4. Push Notifications — Expo Push

### 4.1 Token Registration

```tsx
// apps/mobile/hooks/usePushNotifications.ts

import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';

export async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-expo-project-id',
  });

  // Store token in profiles table
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('profiles')
      .update({ push_token: token.data })
      .eq('auth_id', user.id);
  }

  return token.data;
}
```

### 4.2 Push Sending Edge Function

```tsx
// supabase/functions/push-notification/index.ts

serve(async (req) => {
  const { profileId, title, body, data } = await req.json();

  // Get push token from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', profileId)
    .single();

  if (!profile?.push_token) return new Response('No token', { status: 200 });

  // Send via Expo Push API
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: profile.push_token,
      title,
      body,
      data,  // { screen: 'event', params: { slug: 'event-slug' } }
      sound: 'default',
      badge: 1,
    }),
  });

  return new Response(JSON.stringify(await response.json()), { status: 200 });
});
```

### 4.3 Deep Linking from Notifications

```tsx
// apps/mobile/app/_layout.tsx

Notifications.addNotificationResponseReceivedListener((response) => {
  const { screen, params } = response.notification.request.content.data;
  if (screen === 'event') {
    router.push(`/event/${params.slug}`);
  } else if (screen === 'ticket') {
    router.push(`/(tabs)/tickets`);
  }
});
```

---

## 5. AI Integration — OpenRouter

> **THIS IS THE MOST CRITICAL SECTION. EVENTOLOGY IS AN AI-NATIVE PLATFORM.**

### 5.1 OpenRouter Client

```tsx
// packages/ai/src/client.ts

export const MODEL_CHAIN = [
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'openai/gpt-oss-120b:free',
  'poolside/laguna-xs.2:free',
  'poolside/laguna-m.1:free',
  'arcee-ai/trinity-large-thinking:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'openai/gpt-oss-20b:free',
] as const;

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIRequestOptions {
  messages: AIMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
  modelTier?: 'heavy' | 'medium' | 'light';  // Determines starting model
}

interface AIResponse {
  content: string;
  model_used: string;
  tokens_used: number;
  latency_ms: number;
}

export async function callAI(options: AIRequestOptions): Promise<AIResponse> {
  const startIndex = options.modelTier === 'heavy' ? 0
    : options.modelTier === 'light' ? 5
    : 2;  // medium starts at model 3

  const startTime = Date.now();

  for (let i = startIndex; i < MODEL_CHAIN.length; i++) {
    const model = MODEL_CHAIN[i];
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://eventology-nu.vercel.app',
          'X-Title': 'Eventology',
        },
        body: JSON.stringify({
          model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 1024,
          response_format: options.response_format,
        }),
        signal: AbortSignal.timeout(30000), // 30s timeout per model
      });

      if (!response.ok) {
        console.warn(`Model ${model} returned ${response.status}, trying next...`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.warn(`Model ${model} returned empty content, trying next...`);
        continue;
      }

      return {
        content,
        model_used: model,
        tokens_used: data.usage?.total_tokens ?? 0,
        latency_ms: Date.now() - startTime,
      };
    } catch (error) {
      console.warn(`Model ${model} failed:`, error);
      continue;
    }
  }

  throw new Error('All AI models exhausted. Service temporarily unavailable.');
}
```

### 5.2 AI Response Caching

```tsx
// packages/ai/src/cache.ts

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function getCachedResponse(cacheKey: string): Promise<string | null> {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data } = await supabase
    .from('ai_cache')
    .select('response')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single();

  return data?.response ?? null;
}

export async function setCachedResponse(
  cacheKey: string,
  response: string,
  modelUsed: string,
  promptHash: string,
  tokensUsed: number,
  latencyMs: number,
  ttlSeconds: number
): Promise<void> {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  await supabase.from('ai_cache').upsert({
    cache_key: cacheKey,
    model_used: modelUsed,
    prompt_hash: promptHash,
    response,
    tokens_used: tokensUsed,
    latency_ms: latencyMs,
    expires_at: expiresAt,
  }, { onConflict: 'cache_key' });
}

export function hashPrompt(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}
```

### 5.3 AI Service Functions (18 Functions)

Each function follows this pattern:

```tsx
// packages/ai/src/services/generate-event-description.ts

import { callAI } from '../client';
import { getCachedResponse, setCachedResponse, hashPrompt } from '../cache';

interface GenerateDescriptionInput {
  title: string;
  type: string;
  bulletPoints: string[];
  language: 'en' | 'am';
}

interface GenerateDescriptionOutput {
  description: string;
  shortDescription: string;
}

export async function generateEventDescription(
  input: GenerateDescriptionInput
): Promise<GenerateDescriptionOutput> {
  const cacheKey = `desc:${hashPrompt(JSON.stringify(input))}`;
  const cached = await getCachedResponse(cacheKey);
  if (cached) return JSON.parse(cached);

  const systemPrompt = `You are an expert event copywriter for Ethiopia's premier event platform.
Generate a professional, engaging event description from the provided details.
Write in ${input.language === 'am' ? 'Amharic' : 'English'}.
Output JSON: { "description": "full rich description (3-5 paragraphs)", "shortDescription": "2-3 sentence summary" }`;

  const userPrompt = `Event: ${input.title}
Type: ${input.type}
Key Points:
${input.bulletPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;

  const response = await callAI({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    modelTier: 'medium',
    response_format: { type: 'json_object' },
    temperature: 0.8,
  });

  const result = JSON.parse(response.content);
  await setCachedResponse(cacheKey, response.content, response.model_used,
    hashPrompt(userPrompt), response.tokens_used, response.latency_ms, 86400);

  return result;
}
```

**Full service function list (implement same pattern for each):**

| # | Function | System Prompt Summary | Model Tier | Cache TTL |
| --- | --- | --- | --- | --- |
| 1 | `generateEventDescription` | Event copywriter — generate from bullet points | Medium | 24h |
| 2 | `generateEventSummary` | Summarize event in 2-3 sentences | Light | 24h |
| 3 | `generateEventTags` | Extract 5-8 relevant tags from title+description | Light | 24h |
| 4 | `generateMarketingCopy` | Generate social media post for specific platform | Medium | 4h |
| 5 | `generatePricingSuggestion` | Analyze market data, suggest optimal prices | Heavy | 1h |
| 6 | `generateAnalyticsNarrative` | Analyze event data, provide actionable insights | Heavy | 1h |
| 7 | `generateAttendeeInsights` | Summarize attendee demographics and patterns | Heavy | 1h |
| 8 | `generatePerformancePrediction` | Predict registrations, revenue, check-in rate | Heavy | 1h |
| 9 | `moderateContent` | Scan for inappropriate content, spam, violations | Heavy | None |
| 10 | `detectFraud` | Detect suspicious registration patterns | Heavy | None |
| 11 | `translateContent` | Translate EN↔︎AM accurately | Light | 7d |
| 12 | `chatbotResponse` | Context-aware conversational response | Medium | None |
| 13 | `generateReport` | Generate formatted platform report | Heavy | 1h |
| 14 | `recommendEvents` | Rank events by relevance for user | Medium | 1h |
| 15 | `searchWithNLP` | Parse natural language query to structured filters | Light | None |
| 16 | `generatePlatformHealthSummary` | Platform health narrative from metrics | Heavy | 1h |
| 17 | `analyzeAuditLog` | Answer natural language questions about audit data | Heavy | None |
| 18 | `generateEventRecap` | Post-event summary from metadata + reviews | Medium | 24h |

### 5.4 Chatbot Architecture

```tsx
// packages/ai/src/services/chatbot.ts

const SYSTEM_PROMPTS = {
  public: `You are Eventology AI, a friendly event discovery assistant for Ethiopia.
Help users find events, answer questions about the platform, and provide recommendations.
You have access to event data. Be concise and always include event links when suggesting events.
Current date: ${new Date().toISOString()}.
Available categories: Conference, Workshop, Meetup, Seminar, Networking, Concert, Exhibition, Training.
Cities: Addis Ababa, Hawassa, Bahir Dar, Adama, Dire Dawa, Jimma.`,

  organizer: `You are Eventology AI, an organizer support assistant.
Help organizers manage events, understand analytics, set up promotions, and use platform features.
You can reference the organizer's event data and provide specific guidance.`,

  admin: `You are Eventology AI, a platform administration assistant.
Help admins with moderation decisions, platform analytics, user management, and system health.
Provide data-driven recommendations.`,

  support: `You are Eventology Support, a customer service assistant.
Answer questions about: creating events, registering, payments, refunds, account issues.
If you cannot help, offer to connect with a human agent.
Be empathetic and professional.`,
};

export async function chatbotResponse(
  userMessage: string,
  context: 'public' | 'organizer' | 'admin' | 'support',
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  contextData?: any  // Current page, user's events, etc.
) {
  const systemPrompt = SYSTEM_PROMPTS[context] +
    (contextData ? `\n\nContext: ${JSON.stringify(contextData)}` : '');

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory.slice(-10),  // Last 10 messages for context window
    { role: 'user' as const, content: userMessage },
  ];

  return callAI({ messages, modelTier: 'medium', temperature: 0.7 });
}
```

### 5.5 AI Workflow Agents

Implemented as Supabase Edge Functions triggered by database webhooks or cron:

```tsx
// supabase/functions/ai-moderation-agent/index.ts

serve(async (req) => {
  const { record } = await req.json(); // Database webhook payload

  // Auto-moderate new event submissions
  if (record.status === 'pending_review') {
    const result = await moderateContent(record.title, record.description);

    if (result.confidence > 0.95 && result.isApproved) {
      // Auto-approve high-confidence safe content
      await supabase.from('events').update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      }).eq('id', record.id);

      await supabase.from('audit_log').insert({
        actor_id: 'system',
        actor_role: 'admin',
        action: 'approve',
        target_type: 'event',
        target_id: record.id,
        details: { automated: true, confidence: result.confidence },
      });
    } else if (result.confidence > 0.90 && !result.isApproved) {
      // Auto-flag suspicious content
      await supabase.from('events').update({
        status: 'pending_review',
        // Add moderation notes
      }).eq('id', record.id);
    }
    // Otherwise: leave in queue for human review
  }
});
```

### 5.6 Graceful Degradation

If all AI models are exhausted or OpenRouter is down:

1. **Chatbot:** Show “AI is temporarily unavailable. Please try again later.” with FAQ links
2. **Recommendations:** Fall back to “Popular Events” (most registrations)
3. **Search NLP:** Fall back to traditional keyword search
4. **Summaries:** Show “Summary unavailable” with full description
5. **Auto-moderation:** Skip AI scan, leave all events for manual review
6. **All other AI features:** Show disabled state with informational message

---

## 6. Internationalization (i18n)

### 6.1 Framework

- **Web:** `next-intl` — Server Component friendly, message bundles
- **Mobile:** `expo-localization` + `i18n-js` — Locale detection and string resolution

### 6.2 Locale Files

```json
// packages/locales/en.json
{
  "common": {
    "search": "Search",
    "register": "Register",
    "login": "Log In",
    "signup": "Sign Up",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "Something went wrong"
  },
  "events": {
    "discover": "Discover Events",
    "featured": "Featured Events",
    "upcoming": "Upcoming Events",
    "trending": "Trending Now",
    "nearMe": "Events Near Me",
    "recommended": "Recommended For You",
    "soldOut": "Sold Out",
    "freeEntry": "Free Entry",
    "registerNow": "Register Now",
    "joinWaitlist": "Join Waitlist",
    "addToCalendar": "Add to Calendar"
  },
  "categories": {
    "conference": "Conference",
    "workshop": "Workshop",
    "meetup": "Meetup",
    "seminar": "Seminar",
    "networking": "Networking",
    "concert": "Concert",
    "exhibition": "Exhibition",
    "training": "Training"
  }
}
```

```json
// packages/locales/am.json
{
  "common": {
    "search": "ፈልግ",
    "register": "ተመዝገብ",
    "login": "ግባ",
    "signup": "ተመዝገብ",
    "cancel": "ሰርዝ",
    "save": "አስቀምጥ",
    "delete": "ሰርዝ",
    "edit": "አርትዕ",
    "loading": "በመጫን ላይ...",
    "error": "ችግር ተፈጥሯል"
  },
  "events": {
    "discover": "ዝግጅቶችን ያግኙ",
    "featured": "ተለይተው የቀረቡ ዝግጅቶች",
    "upcoming": "መጪ ዝግጅቶች",
    "trending": "አሁን ተወዳጅ",
    "nearMe": "በአቅራቢያዬ ያሉ ዝግጅቶች",
    "recommended": "ለእርስዎ የተመከሩ",
    "soldOut": "ተሸጧል",
    "freeEntry": "ነፃ ግቤት",
    "registerNow": "አሁን ተመዝገብ",
    "joinWaitlist": "ወረፋ ተቀላቀል",
    "addToCalendar": "ወደ ቀን መቁጠሪያ ጨምር"
  }
}
```

### 6.3 Language Switcher Component

```tsx
// apps/web/src/components/shared/language-switcher.tsx
// Toggle between 'en' and 'am' — persists to user preferences and cookies
```

### 6.4 Currency Formatting

```tsx
// packages/utils/src/format.ts

export function formatETB(amount: number): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(amount);
}
// Output: "ETB 1,500.00"
```

---

## 7. Calendar Integration

### 7.1 ICS File Generation

```tsx
// packages/utils/src/calendar.ts

export function generateICS(event: {
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  url: string;
}): string {
  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eventology//V1//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(event.startsAt)}`,
    `DTEND:${formatDate(event.endsAt)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.location}`,
    `URL:${event.url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function getGoogleCalendarUrl(event: {
  title: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  description: string;
}): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startsAt)}/${formatDate(event.endsAt)}`,
    location: event.location,
    details: event.description,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
```

---

## 8. Maps & Geolocation

### 8.1 Web — Leaflet + OpenStreetMap

```tsx
// apps/web/src/components/shared/venue-map.tsx
// Use react-leaflet with OpenStreetMap tiles (free, no API key)
// Display marker at event coordinates
// Popup with venue name and address
```

### 8.2 Mobile — react-native-maps

```tsx
// apps/mobile/components/venue-map.tsx
// Use react-native-maps (Google Maps on Android, Apple Maps on iOS)
// Same marker/popup pattern
```

### 8.3 Events Near Me — PostGIS Query

```sql
-- API route: GET /api/public/events/nearby?lat=9.0192&lng=38.7525&radius=10000
SELECT
  e.*,
  ST_Distance(e.coordinates, ST_MakePoint($lng, $lat)::geography) AS distance_meters
FROM events e
WHERE e.status = 'approved'
  AND e.starts_at > NOW()
  AND ST_DWithin(e.coordinates, ST_MakePoint($lng, $lat)::geography, $radius)
ORDER BY distance_meters ASC
LIMIT 12;
```

---

## 9. Authentication — better-auth

### 9.1 Server Configuration

```tsx
// apps/web/src/lib/auth.ts

import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  phoneNumber: {
    enabled: true,
    sendOTP: async ({ phoneNumber, otp }) => {
      // Send OTP via Africa's Talking SMS
      await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          customMessage: `Your Eventology verification code is: ${otp}`,
        }),
      });
    },
  },
  session: {
    strategy: 'database',     // Database-backed sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'attendee' },
      full_name: { type: 'string' },
      phone: { type: 'string', required: false },
      avatar_url: { type: 'string', required: false },
      preferred_language: { type: 'string', defaultValue: 'en' },
    },
  },
  callbacks: {
    async onUserCreated({ user }) {
      // Sync to Supabase profiles table
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase.from('profiles').insert({
        auth_id: user.id,
        email: user.email,
        full_name: user.name || user.email.split('@')[0],
        role: 'attendee',
        preferred_language: 'en',
      });
    },
  },
});
```

### 9.2 Client Configuration

```tsx
// apps/web/src/lib/auth-client.ts

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### 9.3 Middleware (Route Protection)

```tsx
// apps/web/src/middleware.ts

import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const path = req.nextUrl.pathname;

  // Public routes — no auth needed
  if (path.startsWith('/events') || path === '/' || path.startsWith('/search')) {
    return NextResponse.next();
  }

  // Auth required routes
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Organizer routes — require organizer or admin role
  if (path.startsWith('/org')) {
    if (!['organizer', 'admin'].includes(session.user.role)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Admin routes — require admin role
  if (path.startsWith('/admin')) {
    if (session.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 9.4 Supabase RLS Integration

Since we use better-auth instead of Supabase Auth, RLS policies must use a custom approach:

1. API routes use the Supabase **service role key** (bypasses RLS)
2. Application-level authorization is handled by better-auth middleware
3. The API layer enforces access control BEFORE database queries
4. RLS remains enabled as a safety net for direct database access

```tsx
// All protected API routes follow this pattern:
export async function GET(req: NextRequest) {
  // 1. Auth check via better-auth
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return unauthorized();

  // 2. Role check
  if (requiredRole && session.user.role !== requiredRole) return forbidden();

  // 3. Data access via service role (bypasses RLS, but auth is already verified)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await supabase.from('events')
    .select('*')
    .eq('organizer_id', session.user.organizerId); // Scope to user's data

  return NextResponse.json({ data });
}
```

> **⚠️ IMPLEMENTATION DIVERGENCE (recorded 2026-06-10, brain):** The shipped web build
> does NOT use service-role-for-everything as §9.4 sketches. It uses a **JWT bridge**:
> `createAuthedClient(profileId)` mints an HS256 JWT (signed with `SUPABASE_JWT_SECRET`)
> so Postgres `auth.uid()` resolves and **RLS self-enforces per request**. Three clients:
> `createClient()` (anon/public reads), `createAuthedClient()` (protected, RLS-bound),
> `createServiceClient()` (system-only, bypasses RLS — webhooks/edge tasks). This is
> *stronger* than the sketch (RLS is a live control, not just a safety net) and is the
> authority for protected paths. Note RLS is ROW-level, not COLUMN-level — overlapping
> "own update" policies still require app-level role guards on moderation fields.

---

## 10. File Storage — Supabase Storage

### 10.1 Bucket Configuration

| Bucket | Max Size | Allowed Types | Access |
| --- | --- | --- | --- |
| `avatars` | 1 MB | image/jpeg, image/png, image/webp | Public |
| `event-banners` | 5 MB | image/jpeg, image/png, image/webp | Public |
| `event-gallery` | 5 MB | image/jpeg, image/png, image/webp | Public |
| `documents` | 10 MB | application/pdf, image/* | Private (signed URLs) |

### 10.2 Upload Flow

```tsx
// apps/web/src/lib/storage.ts

export async function uploadFile(
  bucket: string,
  file: File,
  path: string
): Promise<string> {
  const supabase = createBrowserClient();

  const fileExt = file.name.split('.').pop();
  const filePath = `${path}/${crypto.randomUUID()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}
```

---

> **Next Document:** V1_MASTER_PART4_TIMELINE.md — Week-by-week execution plan with daily task breakdown, milestones, and verification checkpoints.

---

*Eventology V1 MVP — Integration Specifications Part 3 of 5*

*© 2026 VersaLabs Studio. All rights reserved.*
