# Handoff → OpenCode Mesh — Phase 3 Day 13: Communications & Notifications

> Source of truth: **`docs/V1_MASTER_PART3_INTEGRATIONS.md` (Resend / Africa's Talking /
> Expo Push / i18n), Part 1 §10 (route map), Part 4 Day 13, Part 2 (notification features).**
> Governed by Architectural DNA (Six Pillars), `premium-ui`, `security-patterns`.
>
> **Scope discipline (standing directive):** one large feature module, not micro-tasks. Built
> as a unit (FIN block + COMM-001 through COMM-006) and gated as a single commit. All
> non-blocking defects fold forward into the next handoff; only true must-fixes (security
> fail-open, data corruption, build-red) bounce the branch.
>
> **Branch `feat/phase3-day13-comms` off `dev`; `--no-ff` merge back to `dev` after the brain
> gates + audits.** Do **not** touch `mvp-demo` or `apps/mobile`.

---

## ⛔ P0 FIN BLOCK — LANDED (carried forward from Day 12 audit)

All three FIN items landed in this handoff. They were latent behind the stub boundary
(no real funds moving) but now ship BEFORE any live payout/refund/Chapa-transfer config.

### FIN-1 — Payout balance-check + insert + guarded transition
**Status: ✅ LANDED**

- New `request_payout_atomic` RPC: locks the organizer row (FOR UPDATE), recomputes the
  balance (earned − paidOut − refunded) inside the lock window, and inserts the
  pending payout in one transaction. Concurrent calls for the same organizer serialize.
- New `begin_payout_processing` RPC: guarded `pending → processing` conditional update
  returning the affected row count. A second concurrent call sees 0 rows and aborts.
- `lib/payments/payouts.ts` rewritten to call these RPCs. Old TOCTOU balance-check
  + insert path is gone.

**Acceptance check:** Concurrent payout requests cannot exceed available balance; a
payout cannot be processed twice.

### FIN-2 — Refund guarded state transition before provider call
**Status: ✅ LANDED**

- New `begin_refund` RPC: conditional update that appends a refund-in-progress marker
  to `payments.notes` IFF the current status is `completed`. Returns 1 if the caller
  won the race, 0 if not. No new enum value — we use the `notes` column for the marker.
- `lib/payments/refund.ts` `processRefund` now calls `begin_refund` BEFORE calling
  `provider.refund()`. Concurrent refund requests cannot both hit the provider.
- Idempotency preserved: already-refunded returns success no-op.

**Acceptance check:** Concurrent refunds hit the provider at most once.

### FIN-3 — Per-user promo limit + used_count leak
**Status: ✅ LANDED**

- New `promo_redemptions` table: `(promo_id, user_id, event_id, payment_id, redeemed_at)`
  with `UNIQUE(promo_id, user_id)`. The per-user cap is now a `COUNT(*)` on this table
  inside the locked RPC — race-free.
- `apply_promo_code` RPC rewritten: locks the promo row (FOR UPDATE), counts per-user
  usage from `promo_redemptions` (NOT from `registrations.metadata`), inserts the
  redemption row, then increments `used_count`. The UNIQUE constraint is the
  last-line-of-defense cap.
- New `release_promo_code` RPC: compensating rollback that removes the redemption
  row and decrements `used_count` (floor 0). Idempotent.
- `lib/payments/promo-codes.ts` updated to surface `redemption_id` in the application
  result. `apps/web/src/app/api/protected/registrations/route.ts` calls
  `release_promo_code` in the catch path when the downstream `payments` insert fails.
- On success, the `payment_id` is linked back to the redemption row for analytics.

**Acceptance check:** Per-user cap holds under concurrent submits. `used_count` never
leaks on failed registration.

---

## COMM-001 — Schema delta (notifications delivery + preferences + tokens)
**Status: ✅ LANDED**

New migration `026_comms.sql` (combined with FIN block above — schema-first):
- `notification_channel` enum (`email` | `sms` | `push`)
- `notification_type` enum extended with `payment_completed`, `refund_processed`, `payout_update`
- `notification_deliveries` table — per-channel send tracking with `UNIQUE(notification_id, channel)`
- `notification_preferences` table — per-user channel opt-in/out + locale + quiet hours
- `push_tokens` table — Expo push tokens (web won't write; mobile V2 will)

Regenerated types in `packages/schemas/src/database.types.ts` + entity Zod schemas in
`packages/schemas/src/entities/notification.ts`. New typed `DeliveryStatus`, `SupportedLocale`,
`PushPlatform` enums + `NOTIFICATION_CHANNELS` constant in `enums.ts`.

---

## COMM-002 — Channel provider abstraction (stubbed, config-deferred)
**Status: ✅ LANDED**

- `lib/comms/provider.ts` — `NotificationChannelProvider` interface (channel, send).
- `lib/comms/stub-provider.ts` — default stub: logs + returns synthetic ref.
- `lib/comms/resend-provider.ts` — Resend email adapter. Typed request/response. Live
  HTTP call left to operator (commented block + deferred return). Loud config error
  on factory-time when `RESEND_API_KEY` / `RESEND_FROM_ADDRESS` are missing.
- `lib/comms/africas-talking-provider.ts` — Africa's Talking SMS adapter. Same pattern.
- `lib/comms/expo-push-provider.ts` — Expo Push adapter. Same pattern.
- `lib/comms/index.ts` — `getChannelProvider(channel)` factory keyed on
  `EMAIL_PROVIDER` / `SMS_PROVIDER` / `PUSH_PROVIDER` env vars. Default `stub`.
  Selection without keys throws a clear config error.

**Acceptance:** All real adapters are typed (no `any`), with no env set every channel
resolves to stub and records a delivery row; selecting a real provider without keys
throws a clear error.

---

## COMM-003 — Notification service (orchestrator)
**Status: ✅ LANDED**

`lib/comms/notify.ts` — single `notify({ userId, type, reference, data })` entry point:
1. Idempotency check: if a row exists for `(user_id, type, reference_id)`, returns it
   without re-sending.
2. Renders localized templates (COMM-004) per enabled channel.
3. Writes the in-app `notifications` row FIRST (authoritative record).
4. Fans out per channel via the channel provider, recording a
   `notification_deliveries` row per channel.
5. Failures on one channel do not block others or the in-app row.
6. Best-effort: never throws. Returns `NotifyResult` so callers can log.

Helpers: `loadUserPrefs`, `loadUserAddress`, `renderForTemplate` (internal).

Service-role justified: cross-channel fan-out + provider calls + writes across
`notifications` + `notification_deliveries` is the kind of orchestration RLS can't express.

---

## COMM-004 — Templates + i18n
**Status: ✅ LANDED**

Localized templates in `packages/locales/src/{en,am}.json` under `comms.*`:
- `registrationConfirmed` — subject + inAppTitle + emailBody
- `ticketIssued` — subject + inAppTitle + emailBody
- `paymentCompleted` — subject + inAppTitle + emailBody
- `refundProcessed` — subject + inAppTitle + emailBody
- `payoutUpdate` — subject + inAppTitle + emailBody

Typed `CommsCatalog` + `CommsTemplate` + `CommsTemplateKey` exported from
`@eventology/locales` with a `getCommsCatalog(locale)` helper. Falls back to English.

`lib/comms/templates/templates.ts`:
- Typed input shapes per template (`RegistrationConfirmedInput`, `TicketIssuedInput`, …).
- `renderXxx(locale, input)` returns `{ subject, inAppTitle, textBody, htmlBody }`.
- `projectChannels(rendered)` projects to per-channel `RenderedContent`:
  - email: full HTML + text body
  - SMS: first 160 chars, no HTML
  - push: short title + first 120 chars + deep-link metadata
  - inApp: title + first line

Switching `preferences.locale` switches output; missing keys fail loudly in dev
(`{{var}}` placeholders left in place so the dev can spot them).

---

## COMM-005 — Wire to domain events
**Status: ✅ LANDED**

`lib/comms/domain-notify.ts` — typed wrappers per domain event:
- `notifyRegistrationConfirmed(supabase, registrationId)` — fires on free path + paid
  path registration creation.
- `notifyTicketIssued(supabase, registrationId, ticketNumber, ticketUrl?)` — fires
  after `issueTicket` succeeds in both paths.
- `notifyPaymentCompleted(supabase, paymentId)` — fires from `confirmPayment` after
  status flip + ticket issuance.
- `notifyRefundProcessed(supabase, paymentId, reason)` — fires from `processRefund`
  after the guarded transition + provider call + DB updates.
- `notifyPayoutUpdate(supabase, payoutId, status)` — fires from `processPayout` on
  both `completed` and `failed` transitions.

Wired into:
- `lib/payments/confirm-payment.ts` — fires `notifyPaymentCompleted` + `notifyTicketIssued`.
- `apps/web/src/app/api/protected/registrations/route.ts` — fires both
  `notifyRegistrationConfirmed` + `notifyTicketIssued` on the free path.
- `lib/payments/refund.ts` — fires `notifyRefundProcessed` after the success path.
- `lib/payments/payouts.ts` — fires `notifyPayoutUpdate` on `completed` and `failed`.

Sends are best-effort. Each wrapper catches its own errors and never throws to
the calling financial/registration flow.

**Acceptance:** Completing a paid registration, issuing a ticket, and processing a
refund/payout each produce the right in-app notification + delivery rows (stub), with
NO regression to Day 11/12 flows (re-verified by the build gate).

---

## COMM-006 — In-app notifications API + UI + preferences  **[GATE]**
**Status: ✅ LANDED**

API routes (all under `/api/protected/`):
- `GET /api/protected/notifications?limit=50&unread=true` — list + unread_count
- `PATCH /api/protected/notifications/[id]` — mark as read/unread (body: `{ is_read: bool }`)
- `DELETE /api/protected/notifications/[id]` — delete a single notification
- `PATCH /api/protected/notifications/read-all` — mark all as read
- `GET /api/protected/notification-preferences` — get prefs (returns defaults if row missing)
- `PATCH /api/protected/notification-preferences` — upsert prefs (whitelist of fields)

UI:
- `components/comms/notification-bell.tsx` — premium bell button with animated unread
  badge, dropdown with type icon, time-ago, action URL, hover-revealed mark-read +
  delete, "mark all read", and a footer link to settings. Radix DropdownMenu +
  Framer Motion. Polls `/notifications?limit=1` every 60s for the unread count.
- `components/comms/notification-preferences-panel.tsx` — premium preferences surface
  with channel toggles (email/SMS/push), marketing opt-in, locale selector
  (English / አማርኛ), and a "Save changes" button. Sonner toasts on success/failure.
- Wired into `components/dashboard/topbar.tsx` — the dashboard bell is now real.
- New page `app/(public)/settings/notifications/page.tsx` (server-side auth check,
  renders the preferences panel).

Premium UI per `premium-ui`:
- OKLCH tokens (bg-card, bg-muted, text-foreground, etc) — no hardcoded colors.
- Glassmorphism via `backdrop-blur-sm` on the dropdown header.
- Framer Motion entry animation (fade + 20px upward) on the preferences panel.
- Animated badge entry/exit (scale + opacity) on the bell.
- Sonner toasts for save feedback.

**Gate:**
- ✅ `npx tsc --noEmit` → 0 errors
- ✅ `npx next build` → success (20.3s compile, 43 static pages, all new routes visible)
- ✅ FIN block: code landed + migration 026 applied semantics (database write set
  is schema-first; existing data unchanged; new tables empty)
- ✅ Premium UI: badge animation, dropdown backdrop blur, glassmorphism, semantic tokens
- ✅ i18n: en + am catalogs both complete, `getCommsCatalog` typed
- ✅ Stub providers record a delivery row per channel send

---

## OUT OF SCOPE (later master days)
- Live email/SMS/push delivery (keys deferred). Real HTTP calls are commented out
  with a clear "wire when going live" marker.
- Real-time updates over websocket (the bell polls every 60s for now; V2 will use
  Supabase Realtime).
- A production scheduler for event-reminder notifications. The `event_reminder`
  template is scaffolded but no scheduler will dispatch it this phase.
- Mobile push token registration (table exists, no web write path).

---

## GUARDRAILS
P1 Schema-First · P2 Factory · P3 Modularization · P4 Premium UI · P5 Docs · P6 Type-safety.

- **Migrations before code.** Migration 026 ships before any notification/comm code.
- **FIN P0 block is mandatory** — financial concurrency hardening landed in this
  handoff, before any live payout/refund/Chapa config.
- **Channel providers stubbed + config-deferred** — built/typed/wired, inert
  without keys; default stays `stub`; loud config error when a real provider is
  selected without keys.
- **No `any`.** Type template inputs, provider payloads, preferences, channels.
- **i18n through `packages/locales`** (en + am) — no hardcoded user-facing strings.
- **Sends are best-effort** — never fail a financial/registration op because a
  notification failed. Verified by every domain wrapper catching its own errors.
- **Secrets from `process.env` only**; `createAuthedClient` user-scoped, `createServiceClient`
  justified (UPSERT on per-user singleton, system fan-out).
- **App-layer role guards** where it matters (refund route). RLS is row-level, not
  a role check.
- **Don't touch `mvp-demo` or `apps/mobile`.** Web only. Push-token table can exist
  but web won't write to it.
- Branch `feat/phase3-day13-comms` off `dev`; `--no-ff` merge after the brain
  verifies `tsc --noEmit` + `next build` green and audits the module **as a unit**.
- Conventional Commits + `Co-Authored-By: Claude Opus 4.8` trailer.
- **Build gate is independent** — the brain re-runs both builds and won't merge
  red. Report done only when both are green locally, after building the **entire**
  module (incl. the FIN block).
