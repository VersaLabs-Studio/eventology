# Handoff — Phase 3 Rotation 2: Organizer Completion + Messaging (web) ∥ Mobile Transactional Flows (Expo)

> **Type:** LARGE combined module, two parallel tracks, ONE gate.
> **Branch:** `feat/phase3-rot2-organizer-mobile` off `dev` (currently `15bfb70`).
> **Predecessor:** Rotation 1 merged (`d48c99c`, tag `phase3-rot1`) — admin panel de-mocked, mobile read-only foundation shipped.
> **Builder:** OpenCode (single selected model). Brain (Claude Opus) plans + gates + audits + merges.
> **Live testing:** DEFERRED to MVP completion (after Rotation 3). Do NOT attempt device/e2e runs this rotation — `tsc` + build + `expo start` boot check only.

---

## 0. Read first / orient

This is the second of **3 rotations** to a complete MVP. The pattern: web completes its data + organizer surfaces; mobile gains transactional flows. After Rotation 3 (seed + QA + mobile organizer views) we run the single live end-to-end test.

**Crucial discovery (verified on disk 2026-06-13): the schema is AHEAD of the route/UI layer.** Most of what this rotation needs already has tables and (often) RLS. **Wire over existing schema. Author a new migration ONLY when a required column/table/capability is genuinely missing — and verify by reading the migration first.** Migrations 001–027 exist; the next number is `028`.

Existing, relevant, ALREADY-BUILT pieces you will reuse (do NOT rebuild):
- `supabase/migrations/009_messaging.sql` → `conversations` + `messages` tables.
- `supabase/migrations/011_sponsors.sql` → `sponsors` table.
- `supabase/migrations/004_organizers.sql` → organizers + an organizer **team** concept (read it; confirm the exact table/columns before adding anything).
- `supabase/migrations/026_comms.sql` → a **device/push-token** table (matched `device_token`/`push_token`; read it for the exact name + columns).
- `apps/web/src/app/api/protected/check-in/route.ts` → check-in endpoint (read its request/response shape).
- `apps/web/src/app/api/protected/tickets/route.ts` + `tickets/[id]/route.ts` → ticket retrieval incl. HMAC-signed `qr_data`.
- `apps/web/src/app/api/protected/registrations/route.ts` → registration create (free + paid path; paid path returns the provider checkout URL).
- `apps/web/src/app/api/protected/payments/**` → payment routes (webhook/verify already exist from Day 11/13).
- Comms seam (`@/lib/comms/notify`), payment seam (`getPaymentProvider`), AI seam (`getAIProvider`) — all merged, **do not edit the seams**.
- Admin guard pattern `apps/web/src/lib/api/admin-guard.ts` (`requireAdminRoute` + `writeAuditLog`) — the reference shape for new protected routes.

---

## TRACK A — WEB · P17: Organizer Completion + Messaging + Web Data De-mock

### A1. Finish the web data layer — eliminate ALL remaining `mock-data` imports (REQUIRED)
After Rotation 1 the admin panel is real, but **12 files still import `@/lib/mock-data`**. Every one must be rewired to a real API before Rotation 3 seeds real data. The full list (verify with `grep -rl mock-data apps/web/src` → must return **empty** at the end):

**Public surfaces**
- `apps/web/src/app/(public)/home-page.tsx` — `getUpcomingEvents` → `GET /api/public/events?upcoming=…` (add the query param if missing).
- `apps/web/src/app/(public)/search/page.tsx` + `apps/web/src/hooks/use-search.ts` — `events` → public events API (the NLP `interpret` route already exists; use it for the query, the events API for results).
- `apps/web/src/components/public/category-grid.tsx` — categories → `GET /api/public/categories` (add if missing).
- `apps/web/src/components/public/featured-carousel.tsx` — featured → `GET /api/public/events?featured=true`.
- `apps/web/src/components/ai/recommendations-rail.tsx` — `getEventById` → existing `GET /api/protected/recommendations` (route already exists; just swap).

**Organizer / dashboard surfaces**
- `apps/web/src/app/(organizer)/org/dashboard/page.tsx` — real organizer-scoped stats.
- `apps/web/src/app/(organizer)/org/events/[eventId]/page.tsx` — real event detail (organizer view).
- `apps/web/src/app/(organizer)/org/events/[eventId]/analytics/page.tsx` + `apps/web/src/components/dashboard/analytics-charts.tsx` — real analytics (migration 013 `analytics` tables exist; check before adding).
- `apps/web/src/components/dashboard/event-form.tsx` — categories/venues from real APIs (create/edit event already posts to `/api/protected/events`).
- `apps/web/src/components/dashboard/registration-table.tsx` — `registrations` → `GET /api/protected/registrations?event_id=…` (organizer-scoped; RLS enforces ownership).

All organizer-scoped reads use `createAuthedClient` so RLS self-enforces ownership; use `createServiceClient` ONLY for cross-row aggregates with a justifying comment (the admin-guard `stats` route is your template).

### A2. Organizer check-in dashboard + QR scan (Day 17)
- Build the organizer check-in UI at `org/events/[eventId]/check-in` (page exists) over the **existing** `POST /api/protected/check-in` route — read its contract first.
- Web QR scanning via the device camera (e.g. `@zxing/browser` or `html5-qrcode`; pick one, justify). On scan → call check-in → optimistic UI with success/duplicate/invalid states.
- The ticket `qr_data` is HMAC-signed (`TICKET_HMAC_SECRET`). **Verification stays server-side in the check-in route** — the scanner only transports the payload. Never validate the HMAC client-side.
- Live attendance counter (checked-in / total), recent check-ins list, manual search-and-check-in fallback.

### A3. Team management (Day 17)
- **Read `004_organizers.sql` first.** It contains the team concept. If a team-members table + role column already exist → wire CRUD routes + UI (invite by email/profile, assign role, remove). If the capability is missing → author `028_…` schema-first (table, FK to organizers + profiles, role enum, RLS so only the owner manages the team), regenerate types, THEN build.
- Org-level guard: only the organizer **owner** (or admin) manages team. Reuse the `requireOrganizerOwnership` pattern from `@/lib/ai/role-guard`.

### A4. Sponsors (Day 17)
- Wire CRUD over the **existing** `sponsors` table (011): list/create/edit/delete/reorder, logo URL, tier, website. Organizer-scoped (event or organizer owner). RLS-enforced; app-level ownership guard on every mutation.

### A5. Messaging — organizer ↔ attendee + broadcast (Day 15, folded in)
- Wire routes + UI over the **existing** `conversations` + `messages` tables (009). Read 009 first to learn the shape.
- Required capability: an organizer can **broadcast** to all attendees of an event (announcement), and attendees can reply / DM the organizer. If the existing `conversations`/`messages` schema cannot express a one-to-many broadcast (e.g. no `event_id` scoped/broadcast conversation type), add the minimal column/table in `028_…` — do NOT duplicate a parallel messaging system.
- Delivery is in-app (messages table) + best-effort fan-out via the **comms seam** (`notify`) so attendees get an email/push too. Best-effort, fail-open, fire-and-forget (the verify route in admin-guard is the pattern).
- Rate-limit broadcasts (reuse the AI rate-limit helper's pattern or a simple per-organizer cap) to prevent abuse.

### A6. Drafts / preview (Day 17)
- `org/drafts` page exists — wire it to real draft events (`status='draft'`) and add a preview that renders the public event page for a draft without publishing.

### A7. Push-token registration route (shared — web owns it, mobile P18 consumes it)
- Add `POST /api/protected/devices` (or the name that matches the 026 table) to upsert a caller's Expo push token (token, platform, last_seen). **Read `026_comms.sql` first** for the exact table/columns; wire over it, don't add a new table. Add `DELETE` to deregister on sign-out. Authed + RLS-scoped to the caller's profile.

**Track A acceptance:** `grep -rl mock-data apps/web/src` returns empty; check-in scans and persists; team/sponsors/messaging CRUD persist + RLS-enforced + ownership-guarded; broadcast fans out best-effort via the comms seam; push-token route upserts; `npx tsc --noEmit -p apps/web/tsconfig.json` = 0; `npm run build` = success.

---

## TRACK B — MOBILE · P18: Registration, Payment, Tickets/QR, Push

Build on the Rotation 1 foundation (`apps/mobile`, Expo SDK 54, Expo Router, typed `lib/api.ts`, better-auth/SecureStore, theme, i18n). **Reuse the existing web REST API — the mobile app is a thin client, no business logic duplicated.** Node 22 LTS; keep reanimated/worklets pinned to SDK-54 versions (memory: version mismatch → hang at "bundling 100%").

### B1. Registration flow (MOB-006)
- Replace the disabled "Register — coming soon" CTA on `app/event/[slug].tsx` with the real flow.
- Tier selection → quantity → confirm → `POST /api/protected/registrations`. Handle BOTH responses: free/confirmed (→ ticket) and `pending_payment` (→ payment, B2).
- Auth-gate: prompt sign-in if no session (the auth flow already exists).

### B2. Payment — Chapa webview (MOB-007)
- On the paid path, the registration response carries the provider checkout URL (read the route's paid-path return). Open it in an in-app webview (`react-native-webview`; add to deps, pin to SDK 54).
- Detect the return/callback URL → poll/verify via the existing payment verify route → show success/failure. Payment verification + commission stay **server-side** (Day 11/13 logic, untouched). The app only opens the URL and reads the result.
- Keep the payment provider on the **stub seam** — no live Chapa keys this rotation (memory: external keys deferred). The webview must work against the stub's checkout URL in dev.

### B3. Tickets + QR display + offline cache (MOB-008)
- My Tickets → ticket detail rendering the QR from `qr_data` (`react-native-qrcode-svg` or similar; pin). The QR is the server-signed payload — render verbatim, the organizer scanner (A2) verifies it.
- Offline cache: persist the user's tickets (TanStack Query persisted cache or SecureStore/AsyncStorage) so tickets render without network at the venue.

### B4. Push-token registration (MOB-009)
- On login (and permission grant) register the Expo push token via the A7 route (`expo-notifications`; pin to SDK 54). Deregister (DELETE) on sign-out.
- Wire a basic in-app notifications screen over the existing `GET /api/protected/notifications` (+ read-all). Handling a tapped push (deep-link to the relevant event/ticket) is enough; rich notification categories can wait.

**Track B acceptance:** `npx tsc --noEmit -p apps/mobile/tsconfig.json` = 0; `npx expo start` boots clean; a registration call (free) returns a ticket; paid path opens the stub checkout webview; ticket QR renders and survives airplane-mode; push token registers against A7. Shared types reused (`@eventology/{schemas,utils,locales,config}`); no `any`; no redefined entities.

---

## Schema policy (P1)
- Reuse existing tables (009 messaging, 011 sponsors, 004 team, 013 analytics, 026 device tokens). **Read the migration before assuming a column is missing.**
- If something IS missing, author `028_…sql` (next number) schema-first: table/columns + enum + indexes + RLS, then `supabase gen types` to regenerate `@eventology/schemas`, then build against the types. One migration for the whole rotation; name it for its dominant change.
- Money: integer-scaled 2dp-correct rounding; `FOR UPDATE` illegal on aggregates; guarded conditional UPDATE + ROW_COUNT for any concurrency (registration is already atomic via RPC — don't reimplement).

## Security (verbatim — non-negotiable)
- RLS (016) is the authz source of truth and is **row-level** → every organizer/admin action ALSO needs an app-level ownership/role guard (`requireOrganizerOwnership` / `requireAdmin`). `createAuthedClient` for user/organizer-scoped; `createServiceClient` only for system/aggregate ops **with a justifying comment**.
- Secrets from `process.env` (web) / `EXPO_PUBLIC_*` (mobile public config) ONLY. Never hardcode keys. Do NOT touch the payments/comms/AI seams.
- AI advisory + fail-open everywhere (never auto-block). HMAC ticket verification stays server-side. Chat tier server-enforced.
- External integrations (Chapa/Resend/Africa's Talking/Expo Push/OpenRouter) stay on **stub seams** this rotation — build live-ready, run stub.

## Fold-forward debt to clear in THIS rotation (from R1 audit)
- ✅ already done in R1: detectFraud paid-path fix.
- Migrate admin `revenue` + `reviews` routes from inline role-checks to `requireAdminRoute` (consistency; both currently guard correctly via inline `profile.role !== 'admin'` — low risk, tidy it).
- Swap `window.prompt()` reject-reason on admin organizer/event pages for a proper dialog (P4 premium-UI).
- (Optional) Source mobile entity types from `@eventology/schemas` instead of local thin aliases.

## Out of scope (Rotation 3)
- Comprehensive seed data (50+ events/orgs/registrations/payments/reviews/promos) + test harness + QA polish.
- Full i18n pass (Day 15).
- Mobile **organizer** views (event list, check-in scanner on mobile, mobile analytics) — P20.
- The live end-to-end test (after R3).
- pgvector / V2 AI features. Live external keys.

## Gate & report (self-run BEFORE reporting; brain re-runs all of it)
1. `npx tsc --noEmit -p apps/web/tsconfig.json` → 0
2. `npx tsc --noEmit -p apps/mobile/tsconfig.json` → 0
3. `npm run build` → all packages succeed
4. `grep -rl mock-data apps/web/src` → **empty**
5. `npx expo start` boots without redbox (no device test required)
6. Report: branch, commit, files changed, per-item (ORG-/MOB-) status, any `028` migration authored (with rationale), assumptions, and anything deferred. List every new protected route and confirm its guard.

**Then:** code-review (OpenCode) → brain re-gate + audit (mock-data zero, guard/ownership enforcement, fail-open comms, HMAC server-side, type reuse) → `--no-ff` merge to `dev` → tag `phase3-rot2`.
