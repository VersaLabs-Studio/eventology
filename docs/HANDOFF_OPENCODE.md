# Handoff → OpenCode Mesh

> Running ticket list of build/fix work routed from the Claude Code (Opus) brain
> to the OpenCode mesh. Brain decides + judges; mesh builds + fixes.
> Work tickets **top to bottom** (TICKET-001 first). Mark `STATUS:` as you go.

---

## CONTEXT SNAPSHOT (as of 2026-06-04)

**Phase 1A–1D are complete and the remote DB is fully stood up.**

| Layer | State |
|-------|-------|
| DB schema (18 migrations, 001–018) | ✅ Applied to remote (`dgpccoegetxwkabcujje`) |
| Seed data (017: 8 categories, 15 profiles, 10 organizers, 12 venues, 55 events, 150 registrations, tiers, notifications, audit, promo, sponsors, messages) | ✅ Applied |
| RLS policies (016) | ✅ Applied + verified in dashboard |
| better-auth tables (`user`, `session`, `account`, `verification`) | ✅ Created via `@better-auth/cli migrate` |
| Zod schemas + shared packages (`@eventology/*`) | ✅ Built (Phase 1B) |
| AI package (18 functions, OpenRouter fallback chain) | ✅ Built (Phase 1D) |
| External keys (Chapa, Resend, Africa's Talking) | ⏸️ Officially deferred to a later MVP stage |

**Identity model (important):** This stack uses **better-auth, NOT Supabase
GoTrue**. Migration 017 dropped the `profiles.id → auth.users(id)` FK and the
`on_auth_user_created` trigger. `public.profiles` is the **canonical app identity
table**; better-auth owns `user`/`session`/`account`/`verification`. They are
linked by a **shared UUID** (no DB-level FK between `user` and `profiles`) —
integrity is enforced at the app layer by the `onUserCreated` callback in
`auth.ts`. See TICKET-001 — this link is currently broken for real signups.

### Environment / setup notes (so you can reproduce locally)
- **Monorepo:** `main` is a Turborepo workspace. Run `npm install` at the **repo
  root** (not inside `apps/web`) — deps hoist to root `node_modules`.
- **`SUPABASE_DB_URL` must be the Session Pooler DSN**, not the API URL and not
  the IPv6-only direct connection:
  `postgresql://postgres.<ref>:[PWD]@aws-0-<region>.pooler.supabase.com:5432/postgres`
  (`supabase db push` works regardless — it uses the CLI's own connection — but
  better-auth / raw `pg` / `supabase gen types` need this value correct.)
- The better-auth CLI does **not** read `.env.local`; export the var in-shell first.

---

## TICKET-001 — better-auth user IDs must be UUIDs (breaks real signups)

**STATUS:** OPEN — **do this first**
**Area:** `apps/web/src/lib/auth.ts`
**Severity:** High — every real signup currently fails; not caught by the seed.

### Problem
better-auth's default `user.id` is a 32-char random **string**, but the schema
keys identity on **`UUID`**: `public.profiles.id` is `UUID`, and every domain
table (`organizers.profile_id`, `registrations.user_id`, `payments.user_id`,
`reviews.user_id`, `notifications.user_id`, `messages.sender_id`,
`audit_log.actor_id`, …) FKs to `profiles(id)`.

The `onUserCreated` callback (`auth.ts:75-80`) inserts `id: user.id` into
`public.profiles.id`. Because `user.id` isn't a UUID, this insert fails with
`invalid input syntax for type uuid` (SQLSTATE 22P02) — the same class of error
that broke the seed. The user can authenticate but has no profile, so every
downstream FK insert then fails too.

### Required fix (preferred)
Make better-auth mint UUIDs so its IDs line up with the schema:

```ts
export const auth = betterAuth({
  // ...existing config...
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
});
```

The `user.id` column stays `text` but now holds a UUID string, which casts
cleanly into `profiles.id UUID`. No schema migration needed.

### Do NOT
Do not change `profiles.id` to `TEXT` — it cascades a type change across ~10 FKs
and the RLS policies. Rejected.

### Acceptance
- New email/password signup creates a row in better-auth `user` AND a matching
  `public.profiles` row with the **same UUID**.
- A follow-on insert FKing to `profiles(id)` (e.g. a registration) succeeds.
- `crypto.randomUUID()` resolves in the Next.js runtime in use (Node 18+/edge
  both expose it globally).

---

## TICKET-002 — Generate DB types, replace handwritten types (P6)

**STATUS:** OPEN
**Area:** `packages/schemas/src/` (+ web/mobile consumers)
**Depends on:** DB live (✅ done)

### Task
The DB is connected now, so kill the handwritten table types and generate from
the source of truth:

```bash
# requires SUPABASE_DB_URL (Session Pooler) or `supabase link`
npx supabase gen types typescript --linked > packages/schemas/src/database.types.ts
```

Then:
- Re-export `Database`, `Tables<'...'>`, `Enums<'...'>` helpers from
  `@eventology/schemas`.
- Replace any hand-rolled row/enum types in web + AI packages with the generated
  ones. Zod schemas stay as the validation layer; generated types are the DB
  shape layer — keep both, don't duplicate.

### Acceptance
- `packages/schemas/src/database.types.ts` exists and matches the 18 migrations.
- No handwritten duplicates of DB row/enum types remain.
- `npm run build` (turbo) is green across the workspace.

---

## TICKET-003 — Factory hooks (P2 Factory Pattern, P3 Modularization)

**STATUS:** OPEN
**Area:** `apps/web/src/hooks/` (or a shared `@eventology/` data package)
**Depends on:** TICKET-002 (generated types)

### Task
Build the generic data-access factory the whole app reuses:
`useList`, `useDoc`, `useCreate`, `useUpdate`, `useDelete` — typed by table name
via the generated `Database` types, talking to the Supabase client. One factory,
parameterized per resource; no per-table copy-paste.

### Acceptance
- A single factory produces all five hooks, fully typed from `Tables<'...'>`.
- RLS is respected (uses the appropriate client: browser/anon vs server/service).
- Used by at least one real resource in TICKET-005 to prove the shape.

---

## TICKET-004 — API routes (`/api/public/*`, `/api/protected/*`)

**STATUS:** OPEN
**Area:** `apps/web/src/app/api/`
**Depends on:** TICKET-002

### Task
Stand up the route groups the middleware already guards (`middleware.ts`):
- `/api/public/*` — unauthenticated reads (published events, categories, venues).
- `/api/protected/*` — any authenticated user (registrations, profile, messages).
- Validate all input with the `@eventology/schemas` Zod schemas. Return typed,
  consistent envelopes. Service-role client only server-side, never exposed.

### Acceptance
- Public routes work unauthenticated; protected routes 401 without a session.
- All bodies/queries validated with Zod; no `any`.

---

## TICKET-005 — Events golden template module (Phase 2 anchor)

**STATUS:** OPEN
**Area:** `apps/web` — full vertical slice for Events
**Depends on:** TICKET-001..004
**Spec source:** `docs/EXECUTION_BLUEPRINT.md`, `docs/BLUEPRINT_*` (components,
pages-public/organizer/admin, types-and-data, polish), `docs/DEMO_SPECIFICATIONS.md`.

### Task
Build the **Events** module as the reference vertical that every other module
(organizers, registrations, payments, …) will be cloned from: schema → factory
hooks → API routes → premium UI pages (public list/detail, organizer
create/edit, admin moderation). This is the P4 Premium-UI golden template — hold
it to the `premium-ui` standard (OKLCH theming, glassmorphism, Framer Motion).

### Acceptance
- End-to-end: browse published events (public) → organizer creates/edits a draft
  → admin approves → it appears publicly. All typed end-to-end, all via the
  factory hooks + API routes, RLS-correct.
- Passes a `ui-auditor` pass before merge.

---

## GUARDRAILS (Six Pillars — enforced)
P1 Schema-First · P2 Factory Pattern · P3 Extreme Modularization · P4 Premium UI ·
P5 Documentation First · P6 End-to-End Type Safety.

- Don't reintroduce Supabase-Auth assumptions (`auth.users`, the mirror trigger).
- Don't hardcode secrets; read from env. External-service code (Chapa/Resend/AT)
  is **deferred** — stub behind interfaces, don't wire live keys yet.
- After each ticket, run the kimi code-review pass; route the result back to the
  Opus auditor before merge.
