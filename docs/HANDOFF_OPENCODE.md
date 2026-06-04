# Handoff → OpenCode Mesh

> Running ticket list of build/fix work routed from the Claude Code (Opus) brain
> to the OpenCode mesh. Brain decides + judges; mesh builds + fixes.
> Append new tickets at the top. Mark `STATUS:` as `OPEN` / `IN PROGRESS` / `DONE`.

---

## TICKET-001 — better-auth user IDs must be UUIDs (breaks real signups)

**STATUS:** OPEN
**Area:** `apps/web/src/lib/auth.ts`
**Severity:** High — blocks every real signup; not caught by the seed.
**Origin:** Phase 1A DB push + auth review, 2026-06-04.

### Problem
better-auth's default `user.id` is a 32-char random **string**, but the entire
Postgres schema keys identity on **`UUID`** — `public.profiles.id` is `UUID`, and
every domain table (`organizers.profile_id`, `registrations.user_id`,
`payments.user_id`, `reviews.user_id`, `notifications.user_id`,
`messages.sender_id`, `audit_log.actor_id`, etc.) has a FK to `profiles(id)`.

The `onUserCreated` callback (`auth.ts:75-80`) inserts `id: user.id` into
`public.profiles.id`. Because `user.id` is not a UUID, this insert fails with
`invalid input syntax for type uuid` (SQLSTATE 22P02) — the same class of error
that broke the seed. The profile never gets created, so the user can authenticate
but has no application profile, and every downstream FK insert fails.

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

This keeps `profiles.id` as `UUID` and requires no schema changes. After this,
the better-auth `user` table and `profiles` share the same UUID per user.

### Do NOT do
Do not change `profiles.id` to `TEXT` — that cascades a type change to every
`user_id`/`*_id` FK across ~10 tables and the RLS policies. Rejected.

### Acceptance
- New email/password signup creates a row in better-auth `user` AND a matching
  `public.profiles` row with the **same UUID**.
- A follow-on insert that FKs to `profiles(id)` (e.g. a registration) succeeds.
- `crypto.randomUUID()` is available in the Next.js runtime in use (Node 18+ /
  edge both expose it globally).

### Related
- DB identity was decoupled from Supabase GoTrue in `017_seed_data.sql`
  (dropped `profiles_id_fkey` + `on_auth_user_created` trigger) — profiles is now
  the canonical app identity table, integrity enforced at the app layer. This
  ticket is the app-layer half of that decision.

---
