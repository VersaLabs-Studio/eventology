# Handoff → OpenCode Mesh — Phase 2 Audit Fixes

> Opus auditor pass on TICKET-001..005 (build was green). Verdict: **strong
> structure, NOT mergeable yet** — the authenticated half of the app is dead at
> runtime. Work these fixes **top to bottom**, then re-run kimi review → back to
> the auditor → merge. Mark `STATUS:` as you go.

**STATUS: ALL FIXES COMPLETE — READY FOR AUDITOR RE-SCORE**

---

## WHY (read first)

The build compiles, but **better-auth and Supabase RLS are not bridged**. Every
policy in `supabase/migrations/016_rls_policies.sql` is keyed on `auth.uid()` —
the Supabase GoTrue JWT subject. This app uses **better-auth**, and
`apps/web/src/lib/supabase/server.ts#createClient()` builds an **anon** client
from Supabase SSR cookies that never exist. So `auth.uid()` is **always NULL**:

- Every protected **write** (`Events: organizer create/update/delete`,
  registrations, …) fails its `WITH CHECK (auth.uid() IS NOT NULL AND …)` →
  returns **500 DB_ERROR**.
- Every owner-scoped **read** matches nothing → returns **empty**.

So T003 mutations, the whole T004 protected surface, and T005's organizer-create
/ admin-moderate flows do not work at runtime. Public reads (approved events,
categories, venues) are fine.

**Chosen fix (architect decision): the JWT bridge.** Sign a Supabase-compatible
JWT from the better-auth session and attach it to the server client. RLS stays
the single source of authz truth — the verified `016` policies enforce
themselves, and the IDOR/mass-assignment holes close as a consequence. Do **not**
re-key the schema off UUID; do **not** scatter hand-rolled authz across handlers.

---

## FIX-001 — Bridge better-auth → Supabase via a signed JWT  **[SEV-1, do first]**

**STATUS:** DONE
**Area:** `apps/web/src/lib/supabase/server.ts`, new `apps/web/src/lib/supabase/jwt.ts`, env

### Task
1. Add `SUPABASE_JWT_SECRET` to env (Supabase Dashboard → Settings → API → **JWT
   Secret**, the HS256 secret). Document it in `.env.example`.
2. New helper `signSupabaseJWT(profileId: string)` — mints an HS256 JWT whose
   claims line up with what RLS expects:
   ```ts
   // lib/supabase/jwt.ts
   import { SignJWT } from 'jose';

   export async function signSupabaseJWT(profileId: string) {
     const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);
     return new SignJWT({ sub: profileId, role: 'authenticated' })
       .setProtectedHeader({ alg: 'HS256' })
       .setIssuedAt()
       .setExpirationTime('1h')
       .setAudience('authenticated')
       .sign(secret);
   }
   ```
   (`sub` MUST be the **profile UUID** = `session.user.id`, since `auth.uid()` is
   compared against `profiles.id` / `*.user_id` / `organizers.profile_id`.)
3. Add an **authenticated** server client that carries the token:
   ```ts
   export async function createAuthedClient(profileId: string) {
     const token = await signSupabaseJWT(profileId);
     return createServerClient(URL, ANON_KEY, {
       cookies: { getAll: () => [], setAll: () => {} },
       global: { headers: { Authorization: `Bearer ${token}` } },
     });
   }
   ```
   Keep the existing anon `createClient()` for **public** routes, and keep
   `createServiceClient()` for genuine **system** ops only (webhooks, the
   `onUserCreated` profile insert, admin batch jobs) — never as the default
   protected path.

### Acceptance
- A protected create/update/delete performed by a logged-in organizer **succeeds**
  through RLS (no service-role bypass).
- The same call by a non-owner is **denied by RLS** (not by ad-hoc code).
- `auth.uid()` inside Postgres resolves to the caller's profile UUID.

---

## FIX-002 — Protected handlers use the authed client + forced ownership  **[SEV-1]**

**STATUS:** DONE
**Area:** `apps/web/src/lib/api/{create,update,delete}-handler.ts`,
`.../protected/events/[id]/registrations/route.ts`
**Depends on:** FIX-001

### Task
- Swap `createClient()` → `createAuthedClient(session.user.id)` in all three
  mutation factories and the protected registrations route. RLS now does the
  ownership/role enforcement, so the IDOR on update/delete-by-id-only closes
  automatically (the `WITH CHECK`/`USING` clauses reject non-owners).
- **Still force server-controlled fields** in `create-handler` — never trust the
  client for these: inject the owner id from the session and force initial
  status. For events that means resolving the caller's `organizer_id` from their
  profile and setting `status` to its pending/draft default. Strip any
  client-supplied `id`, `status`, ownership, or counter fields before insert.
- Confirm `updateEventSchema` / `createEventSchema` do not allow mass-assigning
  `status`, `is_featured`, `organizer_id`, or moderation fields from a normal
  user path (admin moderation is a separate, role-gated route).

### Acceptance
- Organizer creates an event → row has **their** `organizer_id` and the forced
  status, regardless of body.
- Organizer B cannot update/delete Organizer A's event (RLS denial → map to 403).
- Registrations route returns only rows the caller is entitled to see.

---

## FIX-003 — Unify the list envelope (the factory is the broken piece)  **[SEV-2]**

**STATUS:** DONE
**Area:** `apps/web/src/hooks/factory/use-list.ts` ↔ `apps/web/src/lib/api/list-handler.ts`

### Problem
Handlers return `{ data, meta: { total, page, limit } }`; the **factory**
`useList` types/returns `{ data, total, page, limit }`, so `.total/.page` are
`undefined` for every future consumer. `useEvents` manually remaps `json.meta`,
so the Events UI hides the bug — but the factory meant to be cloned everywhere is
the thing left wrong.

### Task
Pick **one** envelope (recommend the `{ data, meta }` shape the handlers already
emit) and make `useList` map `json.meta` → its return type, exactly as
`useEvents` does. Update `ListResponse<T>` accordingly. One shape, both sides.

### Acceptance
- `useList('venues')` (or any non-events entity) returns correct `total`/`page`.
- No consumer reads a field the server doesn't send.

---

## FIX-004 — Minor correctness  **[SEV-3]**

**STATUS:** DONE

- **Category filter** in `public/events/route.ts`: `.eq('category.slug', x)`
  doesn't filter top-level rows. Use the inner-join hint:
  `category:categories!inner(...)` then `.eq('category.slug', x)`.
- **Search robustness:** `search` is interpolated into PostgREST `.or()`; a
  comma/paren in the query breaks the filter. Escape/sanitize the term (strip or
  encode `,`, `(`, `)`, `*`) before building the `or` string. Apply in both the
  public route and `list-handler`.
- **Error envelope drift:** the `VALIDATION_ERROR` responses add a `details`
  field and silently drop `satisfies ErrorEnvelope`. Extend `ErrorEnvelope` with
  an optional `details?: unknown` and keep `satisfies` on every error response so
  the contract holds.

---

## NON-CODE (already assigned to Kidus — do not action, just don't undo)
- `.env.local` lives at the repo root; Next loads env from `apps/web/`. Kidus
  will place it in `apps/web/` for the dev recap. Add `SUPABASE_JWT_SECRET` to
  `.env.example` (FIX-001) so he knows to set it. ✅ Done — created
  `apps/web/.env.example` with `SUPABASE_JWT_SECRET` documented.
- External keys (Chapa/Resend/Africa's Talking) remain **deferred** — keep stubs
  behind interfaces; no live wiring.

---

## GUARDRAILS
P1 Schema-First · P2 Factory · P3 Modularization · P4 Premium UI · P5 Docs · P6 Type-safety.

- RLS (`016`) is the authz source of truth. Service-role is system-only, never
  the default protected path. Don't re-key the schema off UUID.
- After the fixes: re-run kimi review, then route back to the Opus auditor for a
  re-score before merge. The Events module also still owes its `ui-auditor` pass
  (T005 acceptance) once the data layer actually returns rows.

**Re-run complete:** Auditor scored 8.3/10 → PASS_WITH_NOTES. Three required fixes
(unused import, query key invalidation, error envelope parsing) have been resolved.
Build passes. Ready for merge pending Kidus's final sign-off.
