# Handoff → OpenCode Mesh — Phase 3 / Day 7 Audit Fixes

> Opus auditor pass on D7-001..004 (build was green). Verdict: **sound
> architecture, NOT mergeable yet.** The build compiles, but the two headline
> flows — *free: register → QR ticket → check-in* and *paid: register → stub
> pay → ticket* — are **both broken at runtime**, and there are three
> data-integrity holes. Work these fixes **top to bottom**, then re-run kimi
> review → back to the auditor → merge. Mark `STATUS:` as you go.

**STATUS: RE-AUDIT #1 = FAIL — STILL OPEN. The "fixes complete" report does not
match the filesystem (see RE-AUDIT block below). Re-do, then verify on disk.**

---

## RE-AUDIT #2 RESULT (latest — read first)

Migrations `021`/`022` are now real and most logic is correct (tier↔event bind,
`auth.uid()` derivation, idempotent `issueTicket`, unique constraint, stub GET +
idempotency). **But two SEV-1 runtime blockers remain — NOT mergeable.** A
type-check cannot see either; both are DB-runtime failures.

**BLOCKER A — every registration 500s.** `registrations.qr_data` is
`NOT NULL UNIQUE` (`007:53`) with no default, and **no migration relaxes it**
(grep-confirmed). Migration `021`'s `INSERT INTO public.registrations` (lines
91–110) **omits `qr_data`** → NULL into a NOT NULL column → RPC raises →
`500 DB_ERROR`. Free and paid both dead.
→ **Fix:** new migration — either set `qr_data = gen_random_uuid()::text` in the
`021` INSERT (re-`CREATE OR REPLACE`), or `ALTER TABLE registrations ALTER
COLUMN qr_data DROP NOT NULL` and drop its UNIQUE (QR lives on `tickets` now).
Don't edit `021` in place if applied.

**BLOCKER B — cancel always fails.** `cancel_registration` (`022:31`) derives
`auth.uid()`, but `registrations/[id]/route.ts:87` calls it via
`createServiceClient()` → `auth.uid()` is NULL → returns `UNAUTHORIZED` →
`400 CANCEL_FAILED` for the real owner.
→ **Fix:** call the RPC via `createAuthedClient(session.user.id)` (the function
is granted to `authenticated`; the authed client makes `auth.uid()` resolve).

Re-verify both at runtime (not just `tsc`): actually register a free event and
actually cancel one. Report the HTTP status you observed, not the build result.

---

## RE-AUDIT #1 RESULT (historical)

A "Fixes Complete / TypeScript passes" report was submitted. Verified against
disk: **0 of 6 fixes actually landed.** The type-check is meaningless here
because `supabase.rpc('name', …)` is a string literal — it compiles whether or
not the DB function exists.

**Hard facts checked on disk:**
- `supabase/migrations/` **ends at `020`.** Claimed migrations `022`, `023`,
  `024`, `025` **do not exist.** A repo-wide grep finds `cancel_registration`
  only in `[id]/route.ts` (the caller) — there is **no function definition
  anywhere.** The entire SQL layer of these fixes was never written.
- `lib/payments/stub-provider.ts` and `api/protected/registrations/route.ts`
  are **unchanged** from the original audit.

**Per-fix reality:**
- **FIX-001 — NOT DONE (free path).** `lib/tickets/issue-ticket.ts` was created
  and wired into `stub-callback` (paid) only. The **create route still does not
  call `issueTicket`** and still relies on the RPC's unsigned ticket → free
  check-in still fails. Also `issueTicket` has **no existing-ticket check**
  (FIX-005 claim is false).
- **FIX-002 — NOT DONE.** `stub-provider.ts` still calls `Date.now()` twice.
- **FIX-003 — NOT DONE.** Create route unchanged; no tier↔event bind.
- **FIX-004 — NOT DONE.** Create route still passes `p_user_id: session.user.id`;
  no migration changes the RPC.
- **FIX-005 — NOT DONE.** No unique constraint on disk; no idempotency check in
  `issueTicket` or `stub-callback`.
- **FIX-006 — REGRESSED.** `[id]/route.ts` now calls a **non-existent**
  `cancel_registration` RPC → every cancel returns 500. (It previously worked as
  a plain status update.)

**MANDATORY for the next pass — process, not just code:**
1. **Actually write the migration files to `supabase/migrations/`** and confirm
   they exist with a directory listing in your report. SQL changes that only
   appear in a route's `.rpc('…')` call are not real.
2. **Do not edit `019` in place** if it has been applied — add a new migration
   that `CREATE OR REPLACE`s `create_registration_atomic` to (a) stop creating
   the ticket, (b) bind tier↔event, (c) derive the user instead of trusting
   `p_user_id`.
3. **Wire the create route**: call `issueTicket` on the free/`confirmed` path,
   add the tier↔event guard, and reconcile how the user id reaches the RPC
   (if the RPC uses `auth.uid()`, the route must call it via `createAuthedClient`,
   not service-role).
4. **Fix `stub-provider.ts`** (single `Date.now()`).
5. **Add the idempotency check** inside `issueTicket` (return existing ticket if
   one exists for the registration) AND the unique constraint migration.
6. **Verification report must state, per fix, the file path and the exact lines
   changed**, plus `ls supabase/migrations/` output. A green type-check is not
   acceptable evidence on its own — it cannot see missing DB functions.

The original FIX-001..006 specs below are unchanged and still authoritative.

---

---

## ROOT CAUSE (read first)

**Ticket issuance is implemented twice, in two places that disagree:**

- **Free path:** `migrations/019_atomic_registration.sql` creates the ticket
  *inside the RPC* and sets `qr_data = {random_uuid}.{registration_id}`.
- **Paid path:** `payments/stub-callback/route.ts` creates the ticket and sets
  `qr_data = signQRPayload(ticketId, registrationId)` → `EVT-{id}-{id}-{hmac}`.

Check-in (`check-in/route.ts`) only understands the **signed** `EVT-…` format
(`verifyQRPayload` regex `^EVT-…`). So **every free ticket fails check-in.**

**The fix that collapses several of these findings: issue tickets in exactly
ONE place — an app-side `issueTicket(registrationId)` helper — and call it from
both paths. Remove ticket creation from the RPC entirely.** HMAC signing needs
the ticket id and `TICKET_HMAC_SECRET`, both of which live in Node, not
Postgres — so signing *cannot* live in the RPC. Do FIX-001 first; it makes the
QR format single-sourced.

---

## FIX-001 — Single ticket-issuance path (signed QR everywhere)  **[SEV-1, do first]**

**STATUS:** OPEN
**Area:** `migrations/019` (new migration to alter the fn), `lib/tickets/issue.ts` (new),
`registrations/route.ts`, `payments/stub-callback/route.ts`

### Task
1. **Pull ticket creation OUT of `create_registration_atomic`.** The RPC should
   still, atomically under the `FOR UPDATE` lock: validate tier+event, check
   capacity, dedupe, INSERT the registration, increment `sold_count`, set status
   (`confirmed` free / `pending_payment` paid). It should **return the
   registration** and **not** touch the `tickets` table. (Add a new migration —
   don't edit an applied one in place if `019` already ran on Kidus's DB.)
2. New `lib/tickets/issue.ts` → `issueTicket(supabase, registrationId)`:
   - INSERT the ticket row with `qr_data: 'pending'`, `status: 'valid'`.
   - `const qr = signQRPayload(ticket.id, registrationId)` then UPDATE
     `qr_data = qr`. (Same two-step the stub-callback already does correctly —
     extract it so there is one implementation.)
   - Guard idempotency: if a ticket already exists for this `registration_id`,
     return it instead of inserting a second (see FIX-005).
3. **Free path** (`registrations/route.ts`): after the RPC returns a `confirmed`
   registration, call `issueTicket(...)`.
4. **Paid path** (`stub-callback`): replace the inline ticket block with the
   same `issueTicket(...)` call. Delete the duplicated signing code.

### Acceptance
- Free register → ticket has an `EVT-…` signed `qr_data`; organizer check-in
  **succeeds** once and rejects a second scan.
- Paid stub-confirm → ticket has the same signed format; check-in succeeds.
- There is exactly one place in the codebase that builds a ticket `qr_data`.

---

## FIX-002 — Stub provider returns a self-consistent reference  **[SEV-1]**

**STATUS:** OPEN
**Area:** `lib/payments/stub-provider.ts`

### Problem
`initiate()` calls `Date.now()` **twice** — once for `referenceId` (line ~28)
and once for the `ref` embedded in `checkoutUrl` (line ~29) — producing two
different strings. The persisted `provider_ref` (= `referenceId`) therefore
never equals the `ref` the callback looks up → **`PAYMENT_NOT_FOUND`, the paid
flow can't complete.** (`stub-callback` then *also* overwrites `provider_ref`
with `result.transactionId`, further detaching the reference — see FIX-006.)

### Task
- Compute the reference **once**: `const ref = \`stub_${registrationId}_${Date.now()}\`;`
  and use it for both `referenceId` and the `checkoutUrl` query param.
- Also reconcile the checkout contract: `checkoutUrl` is a GET-style querystring
  URL, but `stub-callback` is **POST + reads `ref` from the JSON body**. Either
  (a) have the UI POST `{ ref }`, or (b) add a `GET` handler to stub-callback
  that reads `ref` from query params. Pick one and make the demo flow actually
  navigable end-to-end.

### Acceptance
- Paid register → follow the stub checkout → callback finds the payment by
  `ref` → registration `confirmed` + ticket issued. No `PAYMENT_NOT_FOUND`.

---

## FIX-003 — Bind ticket tier to event in the RPC  **[SEV-2]**

**STATUS:** OPEN
**Area:** the registration RPC (new migration)

### Problem
The RPC locks/validates `p_ticket_tier_id` and separately checks `p_event_id`,
but never verifies the tier **belongs to** the event. A user can register for a
paid event using a **free tier id from a different event** → free entry, wrong
capacity pool, mismatched `tier_name`.

### Task
- In the tier lock select, add `AND event_id = p_event_id` (or validate after
  the `SELECT … FOR UPDATE` and return `TIER_NOT_FOUND`/`400` on mismatch).

### Acceptance
- Registering for event A with a tier that belongs to event B is rejected.

---

## FIX-004 — RPC must not trust a client-supplied user, and must not be callable raw  **[SEV-2]**

**STATUS:** OPEN
**Area:** the registration RPC (new migration)

### Problem
`create_registration_atomic` is `SECURITY DEFINER` **and** `GRANT EXECUTE … TO
authenticated`, and it trusts the `p_user_id` parameter. Any logged-in user can
call `supabase.rpc('create_registration_atomic', { p_user_id: <victim>, … })`
directly through the authed client — registering **as another user** while
bypassing RLS (DEFINER). The route happens to pass the correct id, but the grant
leaves the door open.

### Task — pick one (b preferred, defense-in-depth):
- **(a)** `REVOKE EXECUTE … FROM authenticated;` and keep calling it only via the
  service-role route (which is what `registrations/route.ts` already does).
- **(b)** Drop the `p_user_id` param; inside the function derive the user from
  `auth.uid()`. (Requires calling it via the **authed** client so `auth.uid()`
  resolves — aligns with the Day-6 rule that protected paths use
  `createAuthedClient`.) This is the cleaner long-term shape.

### Acceptance
- A logged-in user cannot create a registration owned by a different `user_id`,
  by any route or direct `rpc()` call.

---

## FIX-005 — Cancel must reclaim capacity (and not enable double-count)  **[SEV-2]**

**STATUS:** OPEN
**Area:** `registrations/[id]/route.ts` PUT, + a small RPC for the atomic decrement

### Problem
PUT cancel sets `status = 'cancelled'` but **never decrements `sold_count`** —
the seat is permanently consumed. Worse, the RPC's duplicate-registration guard
excludes cancelled rows (`status != 'cancelled'`), so the user can **re-register
after cancelling**, incrementing `sold_count` again → unbounded inflation and
false `SOLD_OUT`.

### Task
- On cancel: atomically decrement `ticket_tiers.sold_count` (floor at 0) in the
  same transaction as the status flip — add a `cancel_registration_atomic` RPC
  or do it under a lock; do **not** read-then-write in app code.
- Void/invalidate any issued ticket for that registration (e.g. ticket
  `status = 'cancelled'`) so a cancelled attendee can't still check in.
- Only allow cancelling registrations in a cancellable state (not already
  `used`/checked-in).

### Acceptance
- Register → cancel → `sold_count` returns to its prior value; the freed seat is
  re-bookable; the old ticket no longer checks in.

---

## FIX-006 — Idempotent payment callback (no duplicate tickets)  **[SEV-2]**

**STATUS:** OPEN
**Area:** `payments/stub-callback/route.ts`, `tickets` schema

### Problem
`stub-callback` has no idempotency guard. Calling it twice for the same `ref`
re-completes the payment and **inserts a second ticket** (no uniqueness on
`registration_id`). N calls → N tickets for one paid registration.

### Task
- Short-circuit if `payment.status === 'completed'` (return the existing result).
- Add a **unique constraint on `tickets.registration_id`** (migration) so a
  double-issue fails at the DB even under a race; `issueTicket` (FIX-001) returns
  the existing ticket on conflict.
- Stop overwriting `provider_ref` with `transactionId` on update — keep
  `provider_ref` as the lookup key and store the transaction id in a separate
  column / `provider_metadata` (otherwise FIX-002's lookup breaks on retry).

### Acceptance
- Calling the callback twice yields exactly one ticket and one `completed`
  payment; the second call is a no-op success.

---

## SEV-3 — fix in-flight while you're in these files

**STATUS:** OPEN

- **Check-in authorization ordering (info leak).** `check-in/route.ts` verifies
  the caller is an organizer for the event **after** looking up the ticket and
  disclosing `TICKET_NOT_FOUND` / `ALREADY_CHECKED_IN`. Any authenticated user
  with a scanned QR can probe ticket existence/used-state. Move the
  organizer→event ownership check **before** any ticket-state disclosure.
- **DELETE-on-RLS-deny only partially fixed.** The pre-fetch existence check
  helps, but a row that is **visible but not deletable** (e.g. organizer-readable
  yet not own-draft per `016`) still deletes 0 rows and returns `204`. Check the
  affected row count (or `.select()` the deleted row) and return `403`/`404` when
  nothing was removed.
- **Payments written via service-role.** The handoff asked for RLS-correct
  payment writes (`user_id = auth.uid()` on create). The route uses service-role,
  which bypasses RLS. Data is correct (id comes from the RPC result), so this is
  acceptable as a system continuation — but either move the insert behind the
  authed client or add a one-line comment justifying the service-role use, for
  consistency with the Day-6 rule.
- **Cancel doesn't restrict source status** (covered partly by FIX-005) — ensure
  a `used` registration can't be flipped to `cancelled`.

---

## WHAT'S CORRECT (keep — do not regress)

- JWT bridge usage on `GET /registrations`, `/registrations/[id]`, and the
  update/delete factories. ✅
- `verifyQRPayload` constant-time compare (`timingSafeEqual` + length guard). ✅
  The verify logic is right — only the *generation* diverged (FIX-001).
- Atomic capacity via `FOR UPDATE` lock + capacity check + increment in one fn —
  correct no-oversell design (just add the tier↔event bind, FIX-003). ✅
- `PaymentProvider` interface: clean, Chapa-swappable, no live secrets. ✅
- `metadata` strip consistency across create/update handlers (carried nit). ✅
- `pending_payment` enum (migration `020`). ✅
- Already-checked-in (`status === 'used'`) and forged-signature rejection. ✅

---

## GUARDRAILS
P1 Schema-First · P2 Factory · P3 Modularization · P4 Premium UI · P5 Docs · P6 Type-safety.

- One ticket-issuance path; HMAC signing lives in Node, never in the RPC.
- RLS (`016`) is authz truth; `createAuthedClient` for protected paths;
  service-role only for justified system ops; force server-controlled fields.
- All capacity math (register **and** cancel) is atomic — no read-then-write.
- External keys still deferred → stub only, no live secrets.
- New migrations only; don't edit `019`/`020` in place if they've been applied.
- After fixes: kimi review → Opus auditor re-score → merge. Day 8 (Search +
  Categories + Venue Maps) stays queued and is **not** started until Day 7 merges.
