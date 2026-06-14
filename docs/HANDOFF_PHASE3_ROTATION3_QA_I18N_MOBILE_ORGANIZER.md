# Handoff — Phase 3 Rotation 3 (FINAL): QA + i18n + Payments-Off (web) ∥ Mobile Organizer Views (Expo)

> **This is the last build rotation before the live end-to-end test.** One large module, **two parallel tracks, one combined gate.**
> Branch: `feat/phase3-rot3-qa-mobile-organizer` off `dev`.
> Read this file in full before starting. Brain has already completed all schema/infra for this rotation — see "Schema & Infra status" below. **Do not author new migrations unless a genuine gap appears (next number = 030).**

---

## Context (where we are)

- **Web** is feature-complete and fully de-mocked (R1+R2). All pages read live Supabase data through Next API routes.
- **Mobile** has the full attendee flow (R1 foundation + R2 transactional: registration, ticket QR + offline, notifications tab). **Missing: the organizer-side mobile views.**
- **Remote DB `eventology-v1` is synced through migration 029** (brain pushed 021–029 this rotation): all tables, RLS, API-role grants, and storage buckets are live. Seed (017) holds **55 events / 150 registrations / 150 tickets / 10 organizers / 12 venues / 8 categories / 5 sponsors** — verified readable via the anon path.
- **MVP decision (Kidus, 2026-06-13): NO live payments in the e2e test or the MVP.** The payment scaffold stays in the code; it must be **switched off behind a flag** this rotation (Track A1).

After R3 merges → single **live end-to-end test** on web + mobile.

---

## Schema & Infra status (DONE by brain — do not redo)

| Item | Status |
|---|---|
| Migrations 021–027 (registration/promo/revenue/comms/ai) | ✅ fixed + pushed |
| Migration 028 — API-role grants + RLS on the 4 ungoverned tables | ✅ pushed + verified |
| Migration 029 — storage buckets (`avatars`, `organizer-logos`, `event-banners`, `sponsor-logos`, public-read + own-folder write) | ✅ pushed + verified |
| Seed data readable via anon, PII locked | ✅ verified live |
| `push_tokens` RLS (was the R2 audit finding) | ✅ closed in 028 |

**Next migration number = 030.** Only create one if you hit a real missing table/column/policy — and read the existing migration first (the schema is ahead of the routes; assume it exists until proven otherwise).

---

## TRACK A — WEB (P19): QA + i18n + Payments-Off

### A1 — Disable payments & monetary workflows behind a flag (NEW, required)
The MVP/e2e ships with **no live payments**. Keep every payment code path and provider seam intact; gate the **UI + registration behavior** behind a single flag.

- Add `NEXT_PUBLIC_PAYMENTS_ENABLED` (default `"false"`). Read it through a tiny typed helper (e.g. `lib/config/features.ts` → `paymentsEnabled()`), never `process.env` scattered in components.
- **When payments are OFF:**
  - **Registration** (`/register/[eventId]`, public event detail CTA): only **free** tiers are selectable. If a tier has `price > 0`, render it disabled with a "Tickets on sale soon" badge. Registration always takes the free path (`status='confirmed'`), never returns a `checkout_url`. Never call the Chapa webview path.
  - **Revenue / payout / commission surfaces** — hide or replace with a "Payments coming soon" placeholder and remove from nav: `app/(admin)/admin/revenue`, `app/(organizer)/org/revenue`, and the revenue/earnings cards on `admin/dashboard` and `org/dashboard`.
  - Keep `/api/webhooks/chapa`, the payment provider seam, and `apply_promo_code`/payout RPCs **in place and untouched** — just unreachable from the UI.
- **When ON later**, flipping the flag restores the full paid flow with zero code changes. Document the flag in `.env.example`.
- Mirror the same gate on mobile (see B4).

### A2 — i18n full pass (EN + AM)
- Every user-facing string flows through `@eventology/locales` (no hardcoded copy in components). Audit all R1/R2 pages and components added since the last i18n pass.
- Complete the **Amharic (am)** catalog for all keys (LTR — no RTL work needed). Include dates/numbers/currency formatting via the locale.
- Ensure the language switcher persists choice (cookie/localStorage) and SSR reads it.

### A3 — QA polish + fold-forward debt
- **Cross-viewport / states**: every page has correct loading skeletons, empty states, and error states (TanStack Query `isLoading`/`isError`). Mobile-web breakpoints clean.
- **Fold-forward from R2:**
  1. **Root `package-lock.json` reconciliation** — mobile added its own lockfile + `file:` workspace deps. Run `npm install` at repo root, confirm the workspace resolves, commit any root lockfile delta.
  2. **`lib/transformers.ts` `transformEvent`** still emits the old mock camelCase shape (`bannerImage`, `organizer.isVerified`); pages currently build display shape inline. Normalize: either have the public events endpoint return the canonical shape or introduce a single `useEventFromSlug`/mapper and delete the inline shaping.
  3. **Broadcast rate-limit** is in-memory (per-instance). Leave as-is for the e2e, but add a `// TODO(scale)` note pointing to edge/Redis; do not block on it.
- **a11y**: focus states, alt text on the new image surfaces, dialog focus traps (sponsor/team/reject dialogs).

### A4 — Seed verification (mostly done)
Seed already exceeds the "50+ events" target. Spot-check that QA scenarios are representative (draft + pending + approved events, free + paid tiers, verified + unverified organizers, sold-out tier, an event with sponsors + a conversation). Top up only the specific gaps you find — small, targeted inserts as `030_seed_topup.sql` **only if needed**.

---

## TRACK B — MOBILE (P20): Organizer views (Expo)

Build on the R1/R2 mobile foundation (Expo Router, themed UI, typed API client on `@eventology/*`, AuthContext). Thin client, reuse shared types, no `any`. Add organizer-side screens behind an "is this user an organizer?" gate (reuse `/api/protected/organizers/me`).

### B1 — Organizer event list
- New organizer area (tab or stack from Profile → "Manage events"). Lists the caller's events (any status) via `GET /api/protected/events` (the R2 route that returns the caller's organizer events). Show status badges (draft/pending/approved), registration counts.

### B2 — Mobile check-in scanner
- Camera QR scanner (`expo-camera` BarcodeScanner — **pin to SDK 54**) that reads a ticket's signed `qr_data` and POSTs to `/api/protected/check-in`. HMAC verification stays **server-side** — the app only sends the scanned payload. Show success / already-checked-in / invalid states + a running count. Mirror the web check-in UX.

### B3 — Basic organizer analytics (mobile)
- A simple analytics screen per event using `GET /api/protected/organizers/[id]/events/[eventId]/analytics` and `/stats` (registrations, views, tier distribution, 30-day trend). Render with lightweight native charts; no heavy chart deps.

### B4 — Payments-off parity
- Honor the same payments-off rule as web: free registration only; **do not** surface the Chapa webview or paid tiers. Gate via `EXPO_PUBLIC_PAYMENTS_ENABLED` (default `"false"`). Keep `app/payment/webview.tsx` in the tree, just unreachable.

### Mobile run target (for the eventual e2e)
- Mobile will run via **Expo Go + `expo start`** (hot reload) pointed at the **deployed web API URL** (not `localhost`). Set `EXPO_PUBLIC_API_URL` to the Vercel URL the brain provisions. Use **Node 22 LTS** (Node 25 breaks the Expo tunnel). Pin every new native dep (`expo-camera`) to the SDK-54 version or Metro hangs at "bundling 100%".

---

## Security & constraints (verbatim — unchanged)

- RLS (016/027/028) is the authz source of truth and is **row-level** → every organizer/admin route MUST still enforce an app-level role/ownership guard. Reuse `requireAdminRoute` / `requireOrganizerOwnership`.
- HMAC ticket verification stays **server-side**. Clients render/scan; they never verify.
- AI is advisory + **fail-open** in V1 (never auto-block). Chat tier server-enforced.
- Secrets from `process.env` (web) / `EXPO_PUBLIC_*` (mobile, public only) — never hardcode. Don't touch the payments/comms/AI provider seams (they're merged and correct).
- Don't touch the `mvp-demo` branch (read-only design reference).
- All external integrations (Chapa/Resend/Africa's Talking/Expo Push/OpenRouter) remain **stubbed** — no live keys this rotation.

---

## Gate yourself before reporting

- web `tsc` 0 · mobile `tsc` 0 · `npm run build` success
- `grep -rl mock-data apps/web/src` empty (regression guard)
- With `NEXT_PUBLIC_PAYMENTS_ENABLED=false`: no checkout path reachable; revenue/payout UIs hidden; free registration works end to end against the **live** DB
- i18n: switch to `am` and confirm no raw English keys leak on the main flows
- `expo start` boots clean; organizer scanner/list/analytics render against the live API
- Root `npm install` clean; root lockfile committed

## Report back
Branch + commit + file count; per-item ORG-/MOB- status; the payments-off flag + every surface it gates; any `030` migration with rationale; every new/changed route with its guard; i18n coverage note. Brain re-gates + audits, then `--no-ff` merges to `dev`, tags `phase3-rot3`, and we go to the live e2e.
