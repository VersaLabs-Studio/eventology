# Handoff → OpenCode Mesh — Phase 2 / Day 7: Registration & Ticketing

> Next module per the master roadmap (`IMPLEMENTATION_PHASE2.md`, Day 7).
> Day 6 (Events golden template) is **merged and auditor-approved**. Clone that
> realized vertical — schema → factory hooks → API routes → premium UI — for
> Registrations & Tickets. Mark `STATUS:` as you go; kimi review → auditor → merge.

---

## READ FIRST — the template is the *code*, not the old snippets

`IMPLEMENTATION_PHASE2.md` predates the auth architecture we just locked in. Its
example snippets (`createServiceClient` as the default, no JWT, no ownership
injection) are **stale — do not copy them.** The canonical, approved pattern is
the merged Events module:

| Layer | Copy from (canonical) |
|-------|------------------------|
| Factory hooks | `apps/web/src/hooks/factory/*` + `apps/web/src/hooks/use-events.ts` |
| API factory handlers | `apps/web/src/lib/api/{list,doc,create,update,delete}-handler.ts` |
| Auth bridge | `apps/web/src/lib/supabase/jwt.ts` + `createAuthedClient` in `server.ts` |
| Entity config | `packages/config/src/entity-config.ts`, `query-keys.ts` |
| Route shape | `apps/web/src/app/api/{public,protected}/events/**` |

**Non-negotiable rules carried from Day 6 (these are why the audit passed):**
1. **Protected reads/writes use `createAuthedClient(session.user.id)`** — never
   the anon or service-role client. RLS (`016`) is the single authz source.
2. **Force server-controlled fields.** The client never sets ownership, status,
   counters, or timestamps. For registrations that means **inject
   `user_id = session.user.id`** (RLS `Registrations: authenticated create`
   requires `user_id = auth.uid()`), and set status server-side.
3. **Service-role is system-only** (e.g. issuing tickets, incrementing counters
   under a transaction) — justify each use; never the default path.
4. **Zod-validate every body**, return the standard `{ data, meta }` /
   `{ error: { code, message } }` envelopes. No `any`.

---

## TASK-D7-001 — Registrations module (clone the golden template)  **[do first]**

**STATUS:** OPEN
**Schema:** `registrations` (see migration `006`/`008` + `@eventology/schemas`)
**RLS already live (`016`):** own read (`user_id = auth.uid()`), organizer read,
authenticated create (`user_id = auth.uid()`), own cancel (UPDATE), organizer
update, admin full.

### Routes
```
api/protected/registrations/route.ts          # POST create, GET (my registrations)
api/protected/registrations/[id]/route.ts      # GET one, PUT (cancel/update)
```
(The organizer-facing `GET /api/protected/events/[id]/registrations` already
exists from Day 6 — reuse it.)

### Hooks — `apps/web/src/hooks/use-registrations.ts`
`useMyRegistrations()`, `useRegistration(id)`, `useCreateRegistration()`,
`useCancelRegistration()` — thin wrappers over the factory, same shape as
`use-events.ts`. Add `registrations` to `QUERY_KEY_MAP` + `ENTITY_CONFIG`.

### Server-side logic on create (in a dedicated handler, not the generic factory)
Registration isn't a plain insert — it has invariants. Build a bespoke
`POST` handler that, **inside a single transaction / RPC** (use a Postgres
function via service-role, or `supabase.rpc`):
1. Inject `user_id = session.user.id`.
2. Verify the event is `approved` and the chosen `ticket_tier` has capacity
   (`sold_count < capacity`). Reject with `409 SOLD_OUT` / `400` otherwise.
3. Create the registration, increment `ticket_tiers.sold_count` and
   `events.registrations_count` **atomically** (prevents oversell under
   concurrency — do NOT read-then-write in app code).
4. Set status: free tier → `confirmed`; paid tier → `pending_payment` (see
   TASK-D7-003).

### Acceptance
- Logged-in user registers for a free event → `confirmed` row with **their**
  `user_id`; `sold_count` increments by exactly 1.
- A second concurrent registration past capacity is rejected (no oversell).
- User A cannot read/cancel User B's registration (RLS).

---

## TASK-D7-002 — Tickets + HMAC-signed QR  **[depends on D7-001]**

**STATUS:** OPEN
**Schema:** `tickets`. **RLS:** own read, organizer read, system create
(`auth.uid() IS NOT NULL`), organizer update (check-in), admin.

### Routes / hooks
```
api/protected/tickets/route.ts          # GET — my tickets (tab filter)
api/protected/tickets/[id]/route.ts     # GET — single ticket
api/protected/check-in/route.ts         # POST — organizer scans QR
```
`useMyTickets(tab?)`, `useTicket(id)`, `useCheckIn()`.

### Ticket issuance
On `confirmed` registration, issue a ticket row (system op — service-role is
justified here; document it). 

### QR payload (forgery-resistant — this is the security-sensitive bit)
- Payload: `EVT-{ticketId}-{registrationId}-{hmacSignature}`.
- `hmacSignature = HMAC_SHA256(secret = TICKET_HMAC_SECRET, msg = "{ticketId}.{registrationId}")`,
  base64url. Add `TICKET_HMAC_SECRET` to `apps/web/.env.example` (Kidus sets it).
- **Check-in verifies the HMAC server-side before marking attendance** — never
  trust a scanned payload's IDs without recomputing and constant-time-comparing
  the signature. Reject tampered/duplicate (already-checked-in) tickets.
- Display with `qrcode.react` (already a Phase 2 dependency).

### Acceptance
- Confirmed registration produces exactly one ticket with a valid signed QR.
- Check-in accepts a genuine QR once; rejects a forged signature and a
  second scan of the same ticket.

---

## TASK-D7-003 — Paid-tier flow, payment provider STUBBED  **[deferred-keys boundary]**

**STATUS:** OPEN

External keys (Chapa) are **officially deferred**. Build the full flow up to the
payment boundary, behind an interface — no live keys, no live HTTP calls.

- Define a `PaymentProvider` interface (`initiate`, `verify`, `webhook`) in a
  payments lib; provide a `StubPaymentProvider` that auto-resolves in dev and is
  swapped for `ChapaProvider` later by config — same shape, no rewrite.
- Paid registration → `pending_payment`; the stub "confirms" it in dev so the
  end-to-end demo (register → pay → ticket) runs without keys.
- Keep `payments` table writes RLS-correct (`user_id = auth.uid()` on create).
- **Do not** hardcode or scaffold real Chapa secrets. Leave a `// TODO Phase 3:
  ChapaProvider` marker.

### Acceptance
- Free path: register → ticket, no payment touched.
- Paid path (dev/stub): register → `pending_payment` → stub confirm → ticket.
- Swapping in a real provider later requires only a new class + env, no flow
  changes.

---

## TASK-D7-004 — Premium UI pages (P4)  **[depends on D7-001/002]**

**STATUS:** OPEN
**Spec:** `BLUEPRINT_PAGES_PUBLIC.md`, `BLUEPRINT_PAGES_ORGANIZER.md`, design
rules in `EXECUTION_BLUEPRINT.md` (semantic tokens only, Outfit/Inter, card &
button patterns, Framer Motion, 44px touch targets, glassmorphism overlays).

Wire these to real hooks (replace any mock data):
- `(public)/register/[eventId]/page.tsx` — tier select → register flow.
- `(public)/ticket/[ticketId]/page.tsx` — digital ticket with QR.
- `(public)/my-events/page.tsx` — my registrations/tickets.
- `(organizer)/org/events/[eventId]/registrations/page.tsx` — manage list.
- `(organizer)/org/events/[eventId]/check-in/page.tsx` — scan/check-in.

### Acceptance
- End-to-end demoable: browse → register (free) → see QR ticket → organizer
  checks in. Passes a **`ui-auditor`** pass before merge.

---

## GUARDRAILS
P1 Schema-First · P2 Factory · P3 Modularization · P4 Premium UI · P5 Docs · P6 Type-safety.

- Follow the **merged Events module** as the template, not the stale snippets in
  `IMPLEMENTATION_PHASE2.md`.
- RLS is authz truth; `createAuthedClient` for protected paths; force
  server-controlled fields; service-role only for justified system ops.
- Concurrency-safe capacity (atomic increment / DB function) — no oversell.
- External keys deferred → `PaymentProvider` stub, no live secrets.
- Carry the Day-6 non-blocking nits forward while you're in these files:
  DELETE-returns-204-on-RLS-deny, and the `metadata` strip inconsistency.
- After build: kimi review → Opus auditor re-score → merge. Next in queue after
  this: Day 8 (Search + Categories + Venue Maps).
```
