# HANDOFF — Phase 3 Rotation 1: Admin Panel (Web) + Mobile Foundation (Expo)

> **Type:** Large parallel module — TWO tracks, ONE gate. Build both, report both, merge as one unit.
> **Branch:** `feat/phase3-rot1-admin-mobile` off `dev`
> **Author (brain):** Claude Opus 4.8 · **Builder:** OpenCode
> **Milestone context:** This is rotation 1 of 3 toward a full MVP + live end-to-end test. Rotation 1 = P15 (Admin web) ∥ P16 (Mobile auth+core). Do NOT build P17–P20 here.
> **Date:** 2026-06-12

---

## 0. Why this handoff exists

Web is ~78% done; **mobile is 0%** (`apps/mobile` is an empty shell — only `package.json`). We are going parallel: this rotation finishes the **Admin Panel** on web and stands up the **Expo mobile foundation + core read screens**. Two tracks, gated together so the merge is one coherent unit.

**Read these first (ground truth, do not skip):**
- `docs/V1_MASTER_PART4_TIMELINE.md` Day 16 (admin) + Day 9 (mobile core).
- `apps/web/src/app/(admin)/` — the admin pages already exist as a **mock-data UI shell**.
- `apps/web/src/lib/mock-data.ts` — the mock source every admin page currently imports.
- An existing real admin route to mirror: `apps/web/src/app/api/protected/admin/revenue/route.ts`.
- The Day 14 AI admin routes you will wire in: `apps/web/src/app/api/protected/admin/ai/{moderation,fraud,health,audit}/route.ts` (+ `moderation/run`).
- For mobile design parity ONLY (read-only, never modify): the Expo demo on the `mvp-demo` branch.

---

## 1. Guardrails (non-negotiable — same as every prior module)

- **P1 Schema-First:** No new app code against data until any migration is authored + applied. (This rotation likely needs only a small migration — see ADMIN-007.)
- **P2 Factory / pattern reuse:** Mirror existing route, envelope, and client patterns exactly. Don't invent new conventions.
- **P6 Type Safety:** No `any`. Mobile and web both consume `@eventology/schemas` types. `npx tsc --noEmit` must be clean on **both** apps and every touched package.
- **Auth & RLS:** `createAuthedClient(profileId)` for user/organizer-scoped reads; `createServiceClient()` ONLY for system ops, each with a justifying comment. RLS (migration 016) is the authz source of truth, but it is **row-level — every admin route MUST also enforce an app-level admin role guard** (see ADMIN-001). Never trust the client for role.
- **Secrets:** `process.env` only. Mobile public config via `EXPO_PUBLIC_*`. Never hardcode keys.
- **Don't touch:** the `mvp-demo` branch, the payments/comms/AI seams (already merged). Reference, don't edit.
- **Premium UI (P4):** the admin components are already styled — preserve the aesthetic; you are swapping the data source, not redesigning. Mobile must match the emerald / deep-obsidian identity (see MOB-002).
- **Best-effort contract:** admin AI surfaces (moderation/fraud/health) are advisory; if the AI provider returns null, render an empty/neutral state, never a 500.

---

## 2. WEB TRACK — P15: Admin Panel (de-mock + wire)

**Goal:** every admin page renders **real Supabase data** and every action **persists**, behind an **admin-only guard**. The UI already exists — you are replacing `@/lib/mock-data` imports with real API calls and adding the backing routes. When done, `grep -r "mock-data" apps/web/src/app/(admin) apps/web/src/components/admin` returns nothing.

Current mock-backed surfaces (confirmed):
- `(admin)/admin/dashboard` + `components/admin/platform-stats.tsx` → `platformStats, monthlyGrowth, categoryDistribution, subCityDistribution, dailyActiveUsers`
- `(admin)/admin/users` + `components/admin/user-table.tsx` → `users`
- `(admin)/admin/organizers` + `components/admin/organizer-verification-card.tsx` → `organizers`
- `(admin)/admin/featured` + `components/admin/featured-event-manager.tsx` → `getFeaturedEvents`
- `(admin)/admin/audit-log` + `components/admin/audit-log-table.tsx` → `auditLog`
- `(admin)/admin/moderation` + `components/admin/moderation-card.tsx` → (most complete; wire to real events + the AI moderation queue)
- `(admin)/admin/revenue` → already has a real route (`admin/revenue/route.ts`) — verify it, leave it.

### ADMIN-001 — Admin guard helper (do first)
Create/confirm a single server guard used by EVERY admin route + the `(admin)/layout.tsx`: load the caller's profile role via `createAuthedClient`, 403 unless `role === 'admin'`. Reuse `requireAdmin` from `apps/web/src/lib/ai/role-guard.ts` if it fits; otherwise factor a shared `requireAdminRoute(req)` that returns the session or an `ErrorEnvelope` 401/403. The `(admin)` layout must redirect non-admins. **No admin route may rely on RLS alone.**

### ADMIN-002 — Platform stats / dashboard
`GET /api/protected/admin/stats` — real aggregates via `createServiceClient` (system reporting, justified): total events, total registrations, total users, total revenue (sum completed payments), 30-day growth, category distribution, sub-city distribution, daily-active proxy. Swap `platform-stats.tsx` off mock-data onto this route. Empty/zero states must render cleanly on a fresh DB.

### ADMIN-003 — User management
`GET /api/protected/admin/users` (paginated, search by name/email, filter by role) + `PATCH /api/protected/admin/users/[id]` (activate/deactivate via a `profiles.is_active`/status field — check the schema; if absent, add it in ADMIN-007). Wire `user-table.tsx`. Every mutating action writes an `audit_log` row.

### ADMIN-004 — Organizer verification
`GET /api/protected/admin/organizers` (list with verification status) + `POST /api/protected/admin/organizers/[id]/verify` and `.../reject` (with reason). Update `organizers.is_verified` (+ status/reason columns — check schema, extend in ADMIN-007 if needed). Wire `organizer-verification-card.tsx`. Audit-log each decision. **Best-effort notify** the organizer via the existing comms seam (`notify(...)`) — never block on it.

### ADMIN-005 — Event moderation queue (wire to the AI you already built)
`GET /api/protected/admin/events/pending` (events awaiting approval) + `POST /api/protected/admin/events/[id]/approve` and `.../reject` (reason). On the same page, surface the **AI moderation queue** from the existing `GET /api/protected/admin/ai/moderation` and the **re-moderate** action `POST /api/protected/admin/ai/moderation/run`. Approve flips the event to published/approved; reject sets rejected + reason + best-effort organizer notify. Audit-log each. Wire `moderation/page.tsx` + `moderation-card.tsx` off mock-data onto these.

### ADMIN-006 — Featured events + audit log
- Featured: `GET/POST/DELETE /api/protected/admin/featured` (pin/unpin, optional duration window). Wire `featured-event-manager.tsx`.
- Audit log: `GET /api/protected/admin/audit-log` (paginated, filter by action/actor/date). Wire `audit-log-table.tsx`.
- Also wire the existing Day-14 admin AI surfaces into the dashboard where they fit: fraud queue (`admin/ai/fraud`), platform health (`admin/ai/health`), audit-log AI analysis (`admin/ai/audit`). Advisory panels — neutral empty state if AI is on stub/returns null.

### ADMIN-007 — Schema delta (only if needed)
If any required column is missing (e.g. `profiles.is_active`, `organizers.verification_status`/`rejection_reason`, a `featured_events` table or `events.is_featured`+`featured_until`), author **`supabase/migrations/028_admin.sql`** schema-first with RLS (admin-write via service role; public-read only where appropriate) and **regenerate `packages/schemas/src/database.types.ts`**. Prefer reusing existing columns; check before adding. Keep `payment_status` and all money tables untouched.

**Web acceptance:** no `mock-data` imports remain under `(admin)`/`components/admin`; every page renders real data + zero-states; every action persists + writes audit_log; admin guard enforced on every route and the layout; `npx tsc --noEmit` + `npx next build` both green.

---

## 3. MOBILE TRACK — P16: Expo foundation + core read screens

**Goal:** a running Expo app (boots in Expo Go on a device) with auth and the core **read** screens, built fresh on the shared packages — a **thin typed client over the existing web REST API** (single source of truth; RLS already enforced server-side). **No registration/payment yet** — those are Rotation 2 (P18).

> **Environment (from hard-won memory — honor exactly):** use **Node 22 LTS** (Node 25 breaks the Expo tunnel/web). Target **Expo SDK 54**; pin `react-native-worklets`/reanimated to the SDK-54-matched versions or you'll hang at "bundling 100%" (JS↔native mismatch). Keep the native module list minimal.

### MOB-001 — Project scaffold
Initialize Expo (SDK 54) + **Expo Router** (file-based) + TypeScript inside `apps/mobile`, wired into the Turborepo workspace so it resolves `@eventology/*`. Add `tsconfig` extending the repo base. Scripts: `start`, `android`, `ios`, `lint`, `typecheck`. Confirm `npm install` at root still works and `npx tsc --noEmit` passes in `apps/mobile`.

### MOB-002 — Theme + design system
RN `StyleSheet` theme from the brand identity (emerald `#10B981`/`#059669`, deep-obsidian dark theme, Plus Jakarta Sans). Port the spacing/typography tokens from the timeline's `mobile/lib/theme.ts` reference and the overhaul OKLCH palette. Reference the `mvp-demo` Expo screens for layout parity (read-only). Build the handful of primitives the screens need (Card, Button, Badge, Skeleton, EmptyState, EventCard).

### MOB-003 — Typed API client + data layer
A single `lib/api.ts` consuming `EXPO_PUBLIC_API_URL` (the web app's base URL). Typed against `@eventology/schemas` (reuse the Row/response types — do NOT redefine). Use **TanStack Query** and the **`@eventology/config` query-key factory** so cache keys match web. Consume `@eventology/utils` for ETB/date formatting and `@eventology/locales` for strings. Public endpoints need no auth; protected ones attach the better-auth session (MOB-004).

> **Shared-package safety:** import only RN-safe modules from the packages (pure TS — schemas/config/utils/locales). If any of them pull in a web-only dep (`next/*`, node built-ins), flag it — do not patch around it with `any`.

### MOB-004 — Auth (better-auth on mobile)
Use the **better-auth Expo client** (`@better-auth/expo` + `expo-secure-store`) pointed at the web `BETTER_AUTH_URL`. Add the Expo plugin to the better-auth **server** config in `apps/web/src/lib/auth.ts` if required for native sessions (small, justified web change — note it in the report). Implement **login + signup** screens and a session context; persist the token in SecureStore; attach it to protected API calls. `session.user.id` is the profile UUID (same contract as web).

### MOB-005 — Core screens + navigation
Bottom-tab nav + stack. Screens, all on real API data with loading/empty/error states:
- **Home/Discover** `(tabs)/index` — featured carousel + categories + upcoming (← `/api/public/events`).
- **Search** `(tabs)/search` — keyword + category filter (← `/api/public/events` query; AI NL search optional, can reuse `/api/public/search/interpret`).
- **My Tickets** `(tabs)/tickets` — the logged-in user's registrations (← `/api/protected/registrations`, auth required; QR render is fine, issuance already exists).
- **Profile** `(tabs)/profile` — user info + logout + EN/AM language toggle (from `@eventology/locales`).
- **Event detail** `event/[slug]` — banner, description, tiers, organizer, reviews (← `/api/public/events/[slug]`). Register button is a **disabled/"coming soon"** affordance this rotation (wired in P18).
- **Auth** `auth/login`, `auth/signup`.

**Push token registration is OUT this rotation** (Rotation 2 / P18).

**Mobile acceptance:** `npx tsc --noEmit` clean in `apps/mobile`; `npx expo start` boots and the app loads in Expo Go on a physical device; core screens render live data from the web API; login persists across reload; My Tickets shows the authed user's registrations; no `any`; shared types reused (no redefined entity types).

---

## 4. Fold-forward debt to clear in THIS rotation's code (from the Day 14 audit)

Non-blocking, but fix while you're adjacent:
1. **Paid-path fraud gap** — in `apps/web/src/app/api/protected/registrations/route.ts`, the `detectFraud` fire-and-forget IIFE sits *after* the paid-path `return`, so it only runs for free/zero-price registrations. Move the fraud IIFE **above** the paid-path return (or duplicate the dispatch) so paid registrations also get a signal. Keep it fire-and-forget + fail-open; it must never block or delay the checkout response.
2. **Auto-moderation on event submit** — still fold-forward; only do it if the event-create factory gains a clean post-insert hook. Otherwise leave the admin re-moderate path as the closure. Don't refactor the factory for this.

(Chat-history preload on the widget stays deferred — Rotation 2/3.)

---

## 5. Gate & report (self-run BEFORE reporting — the brain re-runs all of it)

Run yourself and paste results:
- **Web:** `npx tsc --noEmit -p apps/web/tsconfig.json` (exit 0) AND `npx next build` (exit 0).
- **Packages:** `npx tsc --noEmit` clean in every touched package (`schemas`, `config`).
- **Mobile:** `npx tsc --noEmit` in `apps/mobile` (exit 0); `npx expo start` boots clean; confirm a device/Expo-Go load of the core screens.
- **Admin runtime check:** log in as an admin, confirm each page shows real data and one action of each kind (verify organizer, approve/reject event, feature, activate/deactivate user) persists + writes an audit_log row.
- **No mock-data:** `grep -r "mock-data" apps/web/src/app/(admin) apps/web/src/components/admin` → empty.

**Report back:** branch, commit, file count, both gates' results, the admin runtime check, the mobile device-load confirmation, the migration (if any), and an explicit list of anything deferred. Then: brain re-gates (tsc + next build + mobile typecheck) → audits both tracks (admin guard enforcement + no-mock + mobile type reuse + fail-open) → `--no-ff` merge to `dev` → tag `phase3-rot1`.

---

## 6. Out of scope (do NOT build here)
- Organizer live check-in / QR scan / team / sponsors / messaging → **Rotation 2 (P17)**.
- Mobile registration / ticket QR / Chapa webview / push tokens → **Rotation 2 (P18)**.
- Seed data, full QA, i18n full pass, mobile organizer views → **Rotation 3 (P19/P20)**.
- pgvector semantic search → V2.
- Going live on OpenRouter / Chapa / Resend / AT — keys come later; everything stays on stub seams.
