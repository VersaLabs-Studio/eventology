# Handoff → OpenCode Mesh — Phase 3 Day 11: Payments Module (Chapa adapter, config-deferred)

> Source of truth: **`docs/V1_MASTER_PART3_INTEGRATIONS.md` §1 (Chapa)**, Part 1 §10
> (route map), Part 1 §8 / Part 4 Day 11. Governed by Architectural DNA (Six Pillars)
> and `security-patterns`. **Branch `feat/phase3-day11-payments` off `dev`; `--no-ff`
> merge back to `dev` after the brain gates the build.**
>
> **This is the payments MODULE build. Chapa goes live later by config only.** Per the
> standing constraint, external keys (Chapa/Resend/AT/OpenRouter) are **deferred** — you
> build the Chapa adapter so it's ready, but it stays **inert** until keys + config land.
> The default processor remains the existing **stub**. Do **not** touch `mvp-demo` or
> `apps/mobile`.

---

## WHAT ALREADY EXISTS (do not rebuild — extend)

The payments seam is largely built. Read these before writing anything:

- `apps/web/src/lib/payments/provider.ts` — `PaymentProvider` interface (`initiate` /
  `verify` / `webhook`). **This is the contract. Don't change its shape.**
- `apps/web/src/lib/payments/stub-provider.ts` — dev processor, auto-resolves.
- `apps/web/src/lib/payments/index.ts` — `getPaymentProvider()` factory, switches on
  `process.env.PAYMENT_PROVIDER` (default `'stub'`). Has a commented `case 'chapa'`.
- `apps/web/src/app/api/protected/registrations/route.ts` — paid path already creates a
  `payments` row, calls `provider.initiate()`, and returns `checkout_url`. Free path
  issues the ticket immediately.
- `apps/web/src/app/api/protected/payments/stub-callback/route.ts` — completes payment →
  confirms registration → `issueTicket()` (idempotent, ownership-checked, service-role).
- `apps/web/src/lib/tickets/issue-ticket.ts` — signed-QR ticket issuance (reuse as-is).
- Schema: `supabase/migrations/008_payments.sql` (+ `020_pending_payment_status.sql`),
  `packages/schemas/src/entities/payment.ts` / `payout.ts`.

**Verified facts (don't re-litigate):** `payment_method` enum already includes `'chapa'`
(002_enums). `payments.provider` is free `TEXT` (stub/chapa both fine). Middleware already
whitelists `/api/webhooks` (no change needed). better-auth `session.user.id` = profile UUID.
RLS is the JWT bridge: `createAuthedClient(profileId)` for user-scoped reads/writes,
`createServiceClient()` for system/webhook ops (justified — cross-table writes RLS can't
express).

---

## SCHEMA GAPS (schema-first — migrations BEFORE code, P1)

The current `payments` table **cannot store a commission split** — there is no
`platform_fee`/`organizer_amount` column, and `organizers` has **no `commission_rate`**.
Master Part 3 §1.7 requires the split. Resolve schema first.

---

## PAY-001 — Migration: commission columns  **[do first]**

**STATUS:** OPEN
- New migration (next number, e.g. `021_payment_commission.sql`):
  - `ALTER TABLE public.payments ADD COLUMN platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0;`
  - `ADD COLUMN organizer_amount NUMERIC(10,2) NOT NULL DEFAULT 0;`
- Add `PLATFORM_COMMISSION_RATE` (percent, e.g. `5`) to `packages/config/src/constants.ts`.
  **V1 uses a platform-wide default constant.** Per-organizer `organizers.commission_rate`
  is **Day 12** scope — leave a `// TODO Day 12` and don't add that column now.
- Apply the migration; regenerate `packages/schemas/src/generated/database.types.ts`.

### Acceptance
- Migration applies clean; generated types include `platform_fee` + `organizer_amount`;
  `tsc` sees them. No `organizers` schema change.

---

## PAY-002 — Commission split on payment creation

**STATUS:** OPEN
- In `registrations/route.ts` paid path, before/at the `payments` insert, compute:
  - `platform_fee = round(amount * PLATFORM_COMMISSION_RATE / 100, 2)`
  - `organizer_amount = amount - platform_fee`
  and persist both on the row (Part 3 §1.7). Keep the existing atomic-RPC + provider
  flow intact.
- Money math in minor-unit-safe integer cents or a rounding helper — no float drift.

### Acceptance
- A paid registration writes a `payments` row with correct `amount`, `platform_fee`,
  `organizer_amount` (fee + organizer_amount === amount). Free path unchanged.

---

## PAY-003 — Chapa provider adapter (ready, but config-deferred)

**STATUS:** OPEN
- Create `apps/web/src/lib/payments/chapa-provider.ts` — a `class ChapaProvider
  implements PaymentProvider` per **Part 3 §1.4 (init), §1.6 (webhook), verify**:
  - `initiate()` → `POST {CHAPA_BASE_URL}/transaction/initialize` (real Part 3 §1.4
    payload: amount/currency 'ETB'/tx_ref/callback_url=`/api/webhooks/chapa`/return_url),
    returns `{ referenceId: tx_ref, checkoutUrl: data.checkout_url, metadata }`.
  - `verify()` → `GET /transaction/verify/{tx_ref}`.
  - `webhook(payload, signature)` → verify HMAC-SHA256 of raw body against
    `CHAPA_WEBHOOK_SECRET`; on `status==='success'` return `{ success, registrationId }`.
- Wire `case 'chapa'` in `index.ts` factory. **Guard:** if `PAYMENT_PROVIDER==='chapa'`
  but `CHAPA_SECRET_KEY`/`CHAPA_WEBHOOK_SECRET` are absent, **throw a clear config
  error** (don't silently fall back — fail loud so misconfig is obvious). Default
  (`PAYMENT_PROVIDER` unset) stays `stub`.
- Keys come from `process.env` only — **never hardcode**. No live calls in this phase.

### Acceptance
- `chapa-provider.ts` fully typed (no `any`), implements the interface, factory-wired.
- With no env set, `getPaymentProvider()` still returns the stub and the existing flow is
  unchanged. Setting `PAYMENT_PROVIDER=chapa` without keys throws the config error.
- **Not e2e-tested** (keys deferred) — that's expected and acceptable for this phase.

---

## PAY-004 — Real Chapa webhook route (scaffold, inert without keys)

**STATUS:** OPEN
- Create `apps/web/src/app/api/webhooks/chapa/route.ts` (Part 1 §10, Part 3 §1.6):
  - Public (no session — it's an external callback; middleware already allows
    `/api/webhooks`). Read the **raw** body for signature verification.
  - Call `getPaymentProvider().webhook(payload, signature)`.
  - On success, mirror `stub-callback`'s confirm logic via `createServiceClient()`:
    idempotency check (skip if `status==='completed'`) → set payment `completed` + `paid_at`
    → confirm registration → `issueTicket()`. **Reuse the existing confirm/issue logic** —
    extract a shared helper from `stub-callback` if it avoids duplication (P3), don't
    copy-paste the body.
  - Return 200 on processed/idempotent, 401 invalid signature, 404 unknown ref.

### Acceptance
- Route compiles and is reachable unauthenticated; signature failure → 401; replays are
  idempotent. Inert until Chapa keys exist (provider guard). No regression to stub flow.

---

## PAY-005 — QA + build gate  **[gate]**

**STATUS:** OPEN
- `npx tsc --noEmit` → 0 errors; `npx next build` → success.
- **Runtime-verify the stub flow end-to-end** (the part that IS testable now):
  free registration → ticket issued; paid registration → `checkout_url` → stub-callback →
  payment `completed`, registration `confirmed`, ticket issued, commission split stored.
- No regression to Days 6–10 or the aesthetic overhaul.

### Acceptance
- Both builds green; stub free+paid flows verified at runtime; migration applied + types
  regenerated; screenshots/notes of a completed paid-stub registration. Then kimi review →
  brain re-score → `--no-ff` merge to `dev`.

---

## OUT OF SCOPE (next handoff = Day 12)
Revenue dashboard, payouts, **refunds**, promo codes, and **per-organizer
`organizers.commission_rate`** are **master Day 12** — a separate handoff. Do not start
them here. Telebirr is V2.

---

## GUARDRAILS
P1 Schema-First · P2 Factory · P3 Modularization · P4 Premium UI · P5 Docs · P6 Type-safety.

- **Migrations before code.** Regenerate types after applying.
- **Chapa adapter is built but inert** — keys deferred; default provider stays `stub`;
  acceptance for Chapa is code-complete/typed/wired/gated, NOT live e2e. See the
  external-keys-deferred constraint.
- **No `any`.** Type the Chapa request/response shapes (Part 3 §1.4 has them).
- Secrets from `process.env` only — `CHAPA_SECRET_KEY`, `CHAPA_WEBHOOK_SECRET`,
  `PAYMENT_PROVIDER`; never hardcode.
- `createAuthedClient` for user-scoped; `createServiceClient` for webhook/system (justify
  in a comment, as the existing routes do).
- **Don't touch `mvp-demo` or `apps/mobile`.** Web only.
- Branch `feat/phase3-day11-payments` off `dev`; `--no-ff` merge after the brain verifies
  `tsc --noEmit` + `next build` green and re-scores. Conventional Commits +
  `Co-Authored-By: Claude Opus 4.8` trailer.
- **Build gate is independent** — the brain re-runs both builds and won't merge red. Two
  prior "build-clean" reports were false; report done only when both are green locally.
