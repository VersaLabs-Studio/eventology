# Handoff → OpenCode Mesh — Phase 3 Day 12: Revenue & Financial Operations (large module)

> Source of truth: **`docs/V1_MASTER_PART2_FEATURES.md` (revenue/payouts/promo features),
> Part 3 §1 (Chapa transfer/refund), Part 1 §10 (route map), Part 4 Day 12.** Governed by
> Architectural DNA (Six Pillars), `premium-ui`, and `security-patterns`.
>
> **Scope discipline (new standing directive):** this is **one large feature module**, not a
> list of micro-tasks. Build the whole thing, then it gets gated **as a unit** (tsc + next
> build + audit) in a single pass. Non-blocking defects found in audit are folded forward
> into the **next** large handoff (Day 13) as a "carry-forward P0" block — only true must-fixes
> (security fail-open, data corruption, build-red) bounce the branch back. Build everything
> below before reporting done.
>
> **Branch `feat/phase3-day12-revenue` off `dev`; `--no-ff` merge back to `dev` after the
> brain gates the build and audits the module.** Do **not** touch `mvp-demo` or `apps/mobile`.
>
> **Config-deferred (unchanged constraint):** Chapa is live-by-config-only. Disbursement
> (payout) and refund **provider calls are stubbed** behind the existing `PaymentProvider`
> seam — built and wired, inert until keys land. Default processor stays `stub`.

---

## CARRY-FORWARD FROM DAY 11 (fold in here — was deferred, now P0)

- **S6 amount cross-check.** The Chapa webhook (`apps/web/src/app/api/webhooks/chapa/route.ts`)
  calls `provider.verify(txRef)` but does **not** yet compare the verified amount against the
  local `payments` row. Day 11 left a `// TODO Day 12` for it because it needed a denormalized
  column. Add `payments.provider_amount NUMERIC(10,2)` in REV-001, populate it on verify, and
  in the webhook reject (409 `AMOUNT_MISMATCH`) if `provider_amount !== amount`. This closes the
  last spoofing gap on the paid path.

---

## WHAT ALREADY EXISTS (do not rebuild — extend/wire)

Read these before writing anything:

- **`supabase/migrations/008_payments.sql`** — `payments` (+ `024` commission columns:
  `platform_fee`, `organizer_amount`) **and** the full **`payouts`** table
  (organizer_id, event_id, amount, currency, status `payout_status`, provider, provider_ref,
  `bank_account` JSONB, processed_at, completed_at, notes). **Payout schema is done** — you
  wire logic, don't recreate it.
- **`supabase/migrations/015_promo_codes.sql`** — `promo_codes` table **and** a
  `validate_promo_code(p_code, p_event_id, p_user_id)` RPC (`SECURITY DEFINER`) that returns
  validity + discount. **The validator exists but is NOT called anywhere** — wire it.
- **`002_enums.sql`** — `payment_status` includes `refunded`; `payout_status` exists;
  `promo_discount_type` exists.
- **`payments.refunded_at`** column exists; refund is a status transition, not a new table.
- **`apps/web/src/lib/payments/`** — `PaymentProvider` interface (`initiate`/`verify`/`webhook`),
  `StubPaymentProvider`, `ChapaProvider`, `getPaymentProvider()` factory, the shared idempotent
  `confirmPayment()` helper. **Extend the interface for transfers/refunds; keep existing shapes.**
- **`apps/web/src/app/api/protected/registrations/route.ts`** — paid path computes the
  commission split (`platform_fee`/`organizer_amount`) at the `payments` insert using the
  platform-wide `PLATFORM_COMMISSION_RATE`. **REV-002 changes the rate source.**
- **`packages/config/src/constants.ts`** — `PLATFORM_COMMISSION_RATE = 5.0` (the fallback).
- Org/admin dashboards live under `apps/web/src/app/org/...` and the admin tree; they use the
  **dark** theme (Part 2 §8.4). Recharts is a **sanctioned hex exception** for charts.

**Verified facts (don't re-litigate):** RLS (016) is the authz source of truth;
`createAuthedClient(profileId)` for user/organizer-scoped reads/writes, `createServiceClient()`
for system ops (payout processing, refund reversal) with a justifying comment. better-auth
`session.user.id` = profile UUID. Money math must be 2dp-correct integer-scaled (see Day 11 M3)
so DB CHECK constraints never reject.

---

## SCHEMA GAPS (schema-first — migration BEFORE code, P1)

`organizers` has **no `commission_rate`**; there is **no `provider_amount`** on payments; promo
usage is not transactionally tracked against registrations. Resolve schema first in REV-001.

---

## REV-001 — Schema delta migration  **[do first]**

**STATUS:** OPEN
New migration `025_revenue_ops.sql`:
- `ALTER TABLE public.organizers ADD COLUMN commission_rate NUMERIC(5,2) DEFAULT NULL;`
  (NULL = "use platform default"; per-organizer override. Comment it.)
- `ALTER TABLE public.payments ADD COLUMN provider_amount NUMERIC(10,2);` (for the S6 cross-check).
- Refund audit (full-refund only in V1): `ADD COLUMN refund_amount NUMERIC(10,2)`,
  `ADD COLUMN refund_reason TEXT`, `ADD COLUMN refunded_by UUID REFERENCES public.profiles(id)`.
  Partial refunds are **V2** — note it, don't build it.
- A `record_promo_usage`/increment path: either extend `validate_promo_code` or add an atomic
  `apply_promo_code()` RPC that increments `promo_codes.used_count` **inside** the registration
  transaction (no double-spend under concurrency). Keep it `SECURITY DEFINER`.
- Regenerate `packages/schemas/src/generated/database.types.ts` (and touch the affected entity
  schemas in `packages/schemas/src/entities/`).

### Acceptance
Migration applies clean; generated types include the new columns; `tsc` sees them; existing
commission CHECK (`platform_fee + organizer_amount = amount`) still holds.

---

## REV-002 — Per-organizer commission resolution

**STATUS:** OPEN
- Introduce a single resolver (e.g. `apps/web/src/lib/payments/commission.ts`):
  `resolveCommissionRate(organizer): number` → `organizer.commission_rate ?? PLATFORM_COMMISSION_RATE`.
- Update `registrations/route.ts` paid path to fetch the event's organizer rate and feed the
  resolver into the existing 2dp split. **Reuse the Day 11 rounding** (`Math.round(price*rate)/100`,
  then `organizerAmount = round((price-fee)*100)/100`). No float drift.

### Acceptance
A paid registration under an organizer with `commission_rate = 8.0` splits at 8%; one with NULL
falls back to 5%. `platform_fee + organizer_amount === amount` for non-round prices.

---

## REV-003 — Promo code application (wire the existing validator)

**STATUS:** OPEN
- **Apply path:** in the registration flow, when a `promo_code` is supplied, call
  `validate_promo_code` (and the atomic usage-increment from REV-001) **before** computing the
  payment amount. Compute the discounted price (percentage with `max_discount` cap, or fixed),
  floor at 0, then run the commission split on the **discounted** amount. Persist the applied
  code + discount on the registration/payment metadata.
- **Organizer CRUD:** `/api/protected/promo-codes` (list/create/update/deactivate) scoped to the
  organizer's own events via RLS; plus an organizer dashboard surface to manage codes.
- **Validation endpoint:** a lightweight `POST /api/protected/promo-codes/validate` the checkout
  UI can call to preview the discount before submitting.

### Acceptance
A valid code discounts the charged amount and recomputes commission on the discounted total;
`used_count` increments exactly once even under concurrent submits (atomic RPC); expired/maxed/
wrong-event codes are rejected with a clear message; per-user limit enforced.

---

## REV-004 — Refunds (organizer/admin-initiated, full-refund V1)

**STATUS:** OPEN
- `POST /api/protected/payments/[id]/refund` — authorize the caller (event's organizer or admin
  via RLS + app-level role guard), require a `refund_reason`.
- Flow (service-role, justified): set payment `status='refunded'`, `refunded_at`, `refund_amount`
  (= full `amount` in V1), `refunded_by`; **void/cancel the ticket** (reuse the cancellation path
  from `022_cancel_registration_and_ticket_uniqueness.sql`); transition the registration; release
  capacity. Idempotent (already-refunded → no-op 200).
- **Provider hook:** extend `PaymentProvider` with `refund(referenceId, amount)` — Stub resolves
  instantly; `ChapaProvider.refund()` implemented per Part 3 §1 but **inert** until keys land.

### Acceptance
Refunding a completed paid registration flips status, voids the ticket, frees capacity, is
idempotent on replay, and is blocked for non-owners/non-admins. Stub refund path verified at
runtime; Chapa refund code-complete/typed/wired, not e2e.

---

## REV-005 — Payout ledger & disbursement (provider stubbed)

**STATUS:** OPEN
- **Balance computation** (`apps/web/src/lib/payments/payouts.ts`): organizer available balance =
  Σ `organizer_amount` of `completed` payments for their events − Σ amounts of non-failed payouts
  already recorded − refunded amounts. Money-safe.
- `POST /api/protected/payouts` (organizer requests) and the status lifecycle
  `pending → processing → completed/failed` (admin/system advances it). Disbursement provider call
  is **stubbed** behind the provider seam (Chapa transfer / bank), config-deferred.
- Guard against over-disbursement (can't request more than available balance) and double-payout.

### Acceptance
Balance reconciles to the payments ledger; a payout cannot exceed available balance; lifecycle
transitions are guarded; disbursement is stubbed and inert without keys.

---

## REV-006 — Revenue dashboards (premium UI) + QA gate  **[gate]**

**STATUS:** OPEN
- **Organizer financials** (`/org/.../revenue` or analytics tab, dark theme): gross sales,
  platform fees, net (organizer_amount), refunds, available balance, payout history. Recharts for
  trends (sanctioned hex). Loading/empty/error states. Premium glass/motion per `premium-ui`.
- **Admin platform revenue** view: total GMV, platform commission earned, refunds, outstanding
  payouts, per-organizer breakdown.
- All numbers come from the ledger (no client-side money math beyond formatting).
- **Gate:** `npx tsc --noEmit` → 0 errors; `npx next build` → success. Runtime-verify the testable
  paths: discounted paid registration → correct split; full refund → voided ticket + freed
  capacity; payout request within balance. `ui-auditor` pass on the new dashboards.

### Acceptance
Both builds green; dashboards read as premium and reconcile to the ledger; stub flows verified at
runtime; migration applied + types regenerated. Then kimi review → brain re-score → `--no-ff`
merge to `dev` → tag `phase3-day12`.

---

## OUT OF SCOPE (later master days)
Partial refunds, multi-currency, tax/VAT handling, Telebirr (V2), and the comms that *announce*
refunds/payouts (email/SMS/push = **Day 13**). Live Chapa transfer/refund verification is deferred
until keys land. Don't start Day 13 here.

---

## GUARDRAILS
P1 Schema-First · P2 Factory · P3 Modularization · P4 Premium UI · P5 Docs · P6 Type-safety.

- **Migrations before code.** Regenerate types after applying.
- **Money is 2dp-correct, integer-scaled.** All splits/balances reconcile; never trust client math.
- **No `any`.** Type promo/refund/payout/Chapa-transfer shapes.
- **Provider calls for refund/payout are stubbed & config-deferred** — built, typed, wired, inert
  without keys; default stays `stub`. Acceptance for the Chapa-side = code-complete, NOT live e2e.
- Secrets from `process.env` only — never hardcode.
- `createAuthedClient` for organizer/user-scoped; `createServiceClient` for refund reversal /
  payout processing (justify in a comment, as existing routes do). Enforce owner/admin role guards
  at the app level — RLS is row-level, not a substitute for role checks.
- Org/admin dashboards = **dark theme**; Recharts is the only sanctioned hex exception here.
- **Don't touch `mvp-demo` or `apps/mobile`.** Web only.
- Branch `feat/phase3-day12-revenue` off `dev`; `--no-ff` merge after the brain verifies
  `tsc --noEmit` + `next build` green and audits the module **as a unit**. Conventional Commits +
  `Co-Authored-By: Claude Opus 4.8` trailer.
- **Build gate is independent** — the brain re-runs both builds and won't merge red. Report done
  only when both are green locally, after building the **entire** module above.
