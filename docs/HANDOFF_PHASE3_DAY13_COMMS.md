# Handoff → OpenCode Mesh — Phase 3 Day 13: Communications & Notifications (large module)

> Source of truth: **`docs/V1_MASTER_PART3_INTEGRATIONS.md` (Resend / Africa's Talking /
> Expo Push / i18n), Part 1 §10 (route map), Part 4 Day 13, Part 2 (notification features).**
> Governed by Architectural DNA (Six Pillars), `premium-ui`, `security-patterns`.
>
> **Scope discipline (standing directive):** one large feature module, not micro-tasks. Build
> it all, gate as a unit (tsc + next build + audit) in one pass. Non-blocking defects fold
> forward into the next handoff; only true must-fixes (security fail-open, data corruption,
> build-red) bounce the branch.
>
> **Branch `feat/phase3-day13-comms` off `dev`; `--no-ff` merge back to `dev` after the brain
> gates + audits.** Do **not** touch `mvp-demo` or `apps/mobile`.
>
> **Config-deferred (unchanged constraint):** Resend (email), Africa's Talking (SMS), and Expo
> Push are **stubbed behind a provider seam** — built, typed, wired, **inert** until keys land.
> The default channel provider is a **stub** that logs + records a delivery row, sends nothing.

---

## ⛔ P0 BLOCK — Financial Concurrency Hardening (carried forward from Day 12)

These were approved-with-carry-forward in the Day 12 audit because they are **latent behind the
stub boundary** (no real funds move yet). They **MUST land in this handoff** and **before any
live payout/refund/Chapa-transfer config**. Do these as a first-class part of the module.

- **FIN-1 — Payout balance is TOCTOU / not concurrency-safe.** `lib/payments/payouts.ts`
  `requestPayout` reads balance then inserts across separate queries; concurrent requests can
  over-disburse past available balance. `processPayout` moves `pending→processing` without a
  guarded conditional update (concurrent double-disbursement). **Fix:** move the balance-check +
  payout insert into a `SECURITY DEFINER` RPC that locks the organizer's ledger rows
  (`FOR UPDATE` / advisory lock), mirroring `apply_promo_code`. Make the `pending→processing`
  transition a guarded conditional update (`...eq('status','pending')`) and abort if 0 rows hit.
- **FIN-2 — Refund not concurrency-safe; provider called before the DB guard.** `lib/payments/
  refund.ts` `processRefund` checks `status==='completed'` then calls `provider.refund()` BEFORE
  flipping status. **Fix:** transition to an intermediate guarded state (or conditional update
  returning affected rows) **before** the provider call so concurrent refunds can't both hit the
  provider; keep idempotency.
- **FIN-3 — Per-user promo limit bypassable under concurrency + usage leak.** `apply_promo_code`
  counts `registrations.metadata->>'promo_code'`, but the code writes that metadata only in a
  later update — the `FOR UPDATE` lock guards the global `used_count`, not the per-user cap.
  `used_count` also leaks if the payment insert fails after increment. **Fix:** track per-user
  usage inside the locked RPC (dedicated `promo_redemptions` table keyed (promo_id, user_id), or
  increment only after the payment row commits). Re-verify the per-user limit under concurrent
  submits.

### Acceptance (FIN block)
Concurrent payout requests cannot exceed available balance; a payout can't be processed twice;
concurrent refunds hit the provider at most once; per-user promo cap holds under concurrent
submits and `used_count` never leaks on failed registration. Add the migration as part of
COMM-001 (or a sibling migration) — schema-first.

---

## WHAT ALREADY EXISTS (do not rebuild — extend/wire)

- **`supabase/migrations/012_notifications.sql`** — `notifications` table (**in-app only**:
  user_id, type `notification_type`, title, message, action_url, is_read/read_at, polymorphic
  reference_type/reference_id, metadata). **No channel/delivery tracking, no per-channel
  preferences, no push tokens** — that's the gap.
- **`009_messaging.sql`** — direct messaging (separate concern; don't conflate).
- **`packages/schemas/src/entities/notification.ts`** — notification entity/Zod.
- **`packages/locales/src/en.json` + `am.json`** — i18n catalogs (English + Amharic). Comms
  templates must be localized through these, not hardcoded strings.
- **`packages/config/src/constants.ts`** — add comms config here (provider names, from-addresses,
  sender IDs) as needed.
- **Domain hooks to fire notifications from (reuse, don't fork):** `lib/payments/confirm-payment.ts`
  (payment confirmed → ticket issued), `lib/tickets/issue-ticket.ts`, `lib/payments/refund.ts`
  (refund processed), `lib/payments/payouts.ts` (payout status), registration creation.
- **Factory pattern reference:** `lib/payments/index.ts` `getPaymentProvider()` + the loud
  config-guard is the exact pattern to mirror for the channel-provider factory (P2).

**Verified facts:** RLS (016) is authz source of truth; `createAuthedClient` for user-scoped,
`createServiceClient` for system sends (justify in a comment). better-auth `session.user.id` =
profile UUID. Secrets from `process.env` only.

---

## COMM-001 — Schema delta (notifications delivery + preferences + tokens)  **[do first]**

**STATUS:** OPEN
New migration `026_comms.sql` (plus the FIN block migration if separate):
- `notification_deliveries` — per-channel send tracking: id, notification_id FK, channel
  (`email|sms|push` — add a `notification_channel` enum), status (`queued|sent|failed|skipped`),
  provider TEXT, provider_ref TEXT, error TEXT, attempts INT, sent_at, created_at.
- `notification_preferences` — per-user channel opt-in/out + locale: profile_id FK, email_enabled,
  sms_enabled, push_enabled, marketing_opt_in BOOLEAN, locale (`en|am`), quiet-hours optional.
  Sensible defaults (transactional on, marketing off).
- `push_tokens` — Expo push tokens per device (profile_id, token, platform, last_seen). Table can
  exist now even though mobile is untouched; web won't write it yet.
- Extend `notification_type` enum if needed (payment_completed, refund_processed, payout_update).
- Regenerate `packages/schemas/src/generated/database.types.ts` + touch affected entity schemas.

### Acceptance
Migrations apply clean; generated types include new tables/enums; `tsc` sees them.

---

## COMM-002 — Channel provider abstraction (stubbed, config-deferred)

**STATUS:** OPEN
- `lib/comms/provider.ts` — a `NotificationChannelProvider` interface:
  `send(channel, to, rendered): Promise<{ success; providerRef?; error? }>` (or a per-channel
  interface set). Keep the shape stable.
- Adapters: `StubChannelProvider` (default — logs + records a `notification_deliveries` row,
  sends nothing), `ResendProvider` (email, Part 3), `AfricasTalkingProvider` (SMS, Part 3),
  `ExpoPushProvider` (push, Part 3). All real adapters **inert** until keys present.
- `lib/comms/index.ts` — `getChannelProvider(channel)` factory keyed on env
  (`EMAIL_PROVIDER`/`SMS_PROVIDER`/`PUSH_PROVIDER`), default `stub`. **Loud config error** if a
  provider is selected without its keys (mirror the payments factory). No live calls this phase.

### Acceptance
Fully typed (no `any`); with no env set, every channel resolves to stub and records a delivery
row; selecting a real provider without keys throws a clear config error.

---

## COMM-003 — Notification service (orchestrator)

**STATUS:** OPEN
- `lib/comms/notify.ts` — a single `notify({ userId, type, reference, data })` that:
  1. writes the in-app `notifications` row;
  2. resolves the user's `notification_preferences` (channels + locale, default `en`);
  3. renders localized templates (COMM-004) per enabled channel;
  4. dispatches via the channel provider, recording a `notification_deliveries` row per channel;
  5. is **idempotent/dedup-safe** (don't double-send for the same (user, type, reference)).
- Failures on one channel must not block others or the in-app notification (best-effort, logged
  per delivery row).

### Acceptance
A single `notify()` call creates the in-app row + one delivery row per enabled channel; disabled
channels are `skipped`; provider errors are captured on the delivery row, not thrown to the caller.

---

## COMM-004 — Templates + i18n

**STATUS:** OPEN
- Localized templates (en + am via `packages/locales`) for each domain event: registration
  confirmed, ticket issued (with QR/link), payment completed, refund processed, payout update,
  event reminder. Typed template inputs — no `any`, no hardcoded user-facing strings.
- Email = structured (React Email or a typed HTML builder); SMS = concise plain text; push =
  title+body. Keep templates in `lib/comms/templates/`.

### Acceptance
Each event renders correctly in en + am; switching `preferences.locale` switches output; missing
keys fail loudly in dev, not silently.

---

## COMM-005 — Wire to domain events

**STATUS:** OPEN
- Fire `notify()` from the existing flows **without regressing them**: `confirmPayment` (paid
  confirmed → ticket), free-registration ticket issuance, `processRefund`, `processPayout`
  transitions. Event reminders may be a deferred/cron stub — scaffold, don't require a live
  scheduler this phase (note it).
- Sends are best-effort and must never fail the underlying financial/registration operation.

### Acceptance
Completing a paid registration, issuing a ticket, and processing a refund/payout each produce the
right in-app notification + delivery rows (stub), with **no regression** to Day 11/12 flows
(re-verify the stub paid flow + refund still work).

---

## COMM-006 — In-app notifications API + UI + preferences  **[gate]**

**STATUS:** OPEN
- `GET /api/protected/notifications` (list + unread count), `PATCH .../[id]` (mark read),
  `PATCH .../read-all`; `GET/PATCH /api/protected/notification-preferences`.
- UI: notification bell + dropdown (unread badge, mark-read), a preferences surface (channel
  toggles + locale). Premium UI per `premium-ui`; respect public-light / admin-dark theming.
- **Gate:** `npx tsc --noEmit` → 0; `npx next build` → success. `ui-auditor` pass on the new UI.
  Runtime-verify: a stubbed end-to-end notify on paid-registration confirm; mark-read; preference
  toggle suppresses a channel. Plus re-verify the FIN block acceptance (concurrency).

### Acceptance
Both builds green; notifications surface works; preferences honored; FIN block verified; migration
applied + types regenerated. Then kimi review → brain re-score → `--no-ff` merge to `dev` → tag
`phase3-day13`.

---

## OUT OF SCOPE (later master days)
Live email/SMS/push delivery (keys deferred), full AI deployment (**Day 14**), in-app real-time
messaging UI beyond notifications (**Day 15**), a production scheduler for reminders (note the
stub). Don't start Day 14 here.

---

## GUARDRAILS
P1 Schema-First · P2 Factory · P3 Modularization · P4 Premium UI · P5 Docs · P6 Type-safety.

- **Migrations before code.** Regenerate types after applying.
- **FIN P0 block is mandatory** — financial concurrency hardening lands here, before any live
  payout/refund/Chapa config.
- **Channel providers stubbed + config-deferred** — built/typed/wired, inert without keys; default
  stays `stub`; loud config error when a real provider is selected without keys.
- **No `any`.** Type template inputs, provider payloads, preferences.
- **i18n through `packages/locales`** (en + am) — no hardcoded user-facing strings.
- Sends are **best-effort** — never fail a financial/registration op because a notification failed.
- Secrets from `process.env` only; `createAuthedClient` user-scoped, `createServiceClient` system
  sends (justify in a comment).
- **Don't touch `mvp-demo` or `apps/mobile`.** Web only (push-token table may exist, web won't
  write it).
- Branch `feat/phase3-day13-comms` off `dev`; `--no-ff` merge after the brain verifies
  `tsc --noEmit` + `next build` green and audits the module **as a unit**. Conventional Commits +
  `Co-Authored-By: Claude Opus 4.8` trailer.
- **Build gate is independent** — the brain re-runs both builds and won't merge red. Report done
  only when both are green locally, after building the **entire** module (incl. the FIN block).
