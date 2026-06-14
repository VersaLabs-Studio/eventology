# Eventology V1 MVP — Master Timeline & Execution Plan (Part 4 of 5)

> **Author:** Kidus Abdula — Lead SWE & Systems Architect
>
> **Version:** 1.0.0
>
> **Created:** May 25, 2026
>
> **Classification:** Master Source of Truth — Cross-Agent Session Handover
>
> **Timeline:** 4-Week Development Window (May 26 – June 22, 2026)
>
> **Status:** ✅ ARCHITECT APPROVED

<!-- RECOVERY NOTE (2026-06-10): Restored verbatim from Kidus's Notion backup after the
docs/ master set was discarded. Initial recovery was truncated mid-Day-17; the remainder
(Day 17 body, Days 18–22, §7 Testing & Verification Matrix, §8 Risk Register, §9
Milestone Checklist) was re-exported and folded in the same day. This file is now
COMPLETE. -->

---

## Table of Contents

1. Execution Philosophy
2. Pre-Implementation Phase (Day 0)
3. Week 1: Foundation & Schema
4. Week 2: Core Features & Discovery
5. Week 3: Payments, AI & Communication
6. Week 4: Dashboards, Polish & Launch
7. Testing & Verification Matrix
8. Risk Register
9. Milestone Checklist

---

## 1. Execution Philosophy

### 1.1 Golden Template Pattern

Per ARCHITECTURAL_DNA.md §4.4, the **Events** module is the golden template. It is built first with extreme care, and every subsequent module (Registrations, Tickets, Payments, Reviews, etc.) copies its patterns exactly.

### 1.2 Parallel Web + Mobile Development

Web and mobile are developed in parallel. The shared `packages/` layer ensures both platforms consume identical schemas, types, and validation logic. Mobile development begins in Week 1 alongside web.

### 1.3 Schema-First Mandate

**No application code is written until ALL database migrations are authored, reviewed, and applied.** This is non-negotiable per ARCHITECTURAL_DNA.md P1.

### 1.4 AI Integration Cadence

AI features are NOT a separate phase — they are integrated as each domain module is built. When the Events module is built, the AI event description generator, auto-tagger, and recommendation engine are built alongside it.

### 1.5 Continuous Verification

Every day ends with a buildable, deployable state. `npm run build` must pass with zero errors at all times. Broken builds are not accepted overnight.

---

## 2. Pre-Implementation Phase (Day 0)

> **Date:** May 26, 2026 (Monday)
>
> **Duration:** Full day
>
> **Blocker:** V1 implementation CANNOT start until all Day 0 tasks are complete.

### Task 0.1: Branch Strategy Execution

```bash
# Step 1: Create mvp-demo branch from current main
git checkout main
git checkout -b mvp-demo
git push origin mvp-demo

# Step 2: Verify demo continues working on mvp-demo
# Confirm Vercel deployment is connected to mvp-demo branch
# Verify https://eventology-nu.vercel.app/ still serves the demo

# Step 3: Return to main for V1 initialization
git checkout main
```

**Agent Instruction:** Do NOT delete or modify any files on main yet. The mvp-demo branch preserves the demo. Main will be restructured into a Turborepo monorepo in Task 0.3.

### Task 0.2: Expo Demo Build (mvp-demo branch)

**IMPORTANT:** This is executed on the `mvp-demo` branch BEFORE any V1 work on main.

```bash
git checkout mvp-demo

# Initialize Expo project
npx -y create-expo-app@latest ./mobile --template tabs

# Install dependencies
cd mobile
npx expo install expo-router expo-camera expo-location expo-secure-store
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-safe-area-context react-native-screens
```

**Screens to implement (mock data only):**

| Screen | Route | Source Component (Web Demo) | Notes |
| --- | --- | --- | --- |
| Home | `/(tabs)/index.tsx` | `home-page.tsx` | Featured carousel, category grid, upcoming events |
| Discover | `/(tabs)/discover.tsx` | `events/page.tsx` | Event listing with filters |
| Search | `/(tabs)/search.tsx` | `search/page.tsx` | Keyword search with category filter |
| My Tickets | `/(tabs)/tickets.tsx` | `my-events/page.tsx` | Mock ticket cards with QR codes |
| Event Detail | `/event/[slug].tsx` | `events/[slug]/page.tsx` | Banner, description, ticket tiers |
| Profile | `/(tabs)/profile.tsx` | N/A | Simple profile with settings |

**Design Tokens (adapted from web CSS to React Native StyleSheet):**

```tsx
// mobile/lib/theme.ts
export const colors = {
  primary: '#16a34a',      // Eventology green
  accent: '#0ea5e9',       // Sky blue accent
  background: '#fafafa',   // Light mode background
  card: '#ffffff',
  foreground: '#0a0a0a',
  muted: '#737373',
  border: '#e5e5e5',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  display: { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 28 },
  heading: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20 },
  body: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 14 },
  caption: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 12 },
};
```

> **Brand-evolution note (2026-06-10):** The demo accent above is `#16a34a`. The
> Aesthetic Overhaul phase (`IMPLEMENTATION_PLAN_OVERHAUL.md`) intentionally **upgrades**
> the primary accent to a more vibrant emerald (`#10B981` / `#059669`) and introduces a
> deep-obsidian dark theme. Per Part 5 rule #8 ("Do NOT redesign — upgrade"), this is a
> sanctioned evolution of the same identity, applied via OKLCH semantic tokens (not
> scattered hex). Plus Jakarta Sans carries forward as the primary typeface on both web
> and mobile.

**Deliverable:** Run `eas build --platform all --profile preview` for internal distribution. Share link with marketing team.

### Task 0.3: Turborepo Monorepo Initialization (main branch)

```bash
git checkout main

# Initialize Turborepo at root
npx -y create-turbo@latest ./ --example basic

# Expected resulting structure:
# apps/web/       ← Move existing Next.js demo code here
# apps/mobile/    ← Fresh Expo project
# packages/       ← Shared packages
# turbo.json
# package.json (root)
```

**Detailed steps for the implementing agent:**

1. Create root `package.json` with `"workspaces": ["apps/*", "packages/*"]`
2. Create `turbo.json` with build/dev/lint pipelines
3. Create `tsconfig.base.json` with shared compiler options
4. Move ALL existing `src/`, `public/`, `next.config.ts`, `package.json` into `apps/web/`
5. Create `apps/mobile/` — fresh Expo project with Expo Router
6. Create `packages/schemas/` — Zod schemas + generated types
7. Create `packages/config/` — query keys, entity configs, constants
8. Create `packages/utils/` — formatters, validators, geo helpers
9. Create `packages/locales/` — EN/AM translation files
10. Create `packages/ai/` — OpenRouter client, prompt templates, AI service functions
11. Create `supabase/` directory at root with migrations/ and functions/
12. Update all import paths in `apps/web/` to reference `@eventology/schemas`, `@eventology/config`, etc.
13. Verify `turbo run build` passes with zero errors

### Task 0.4: Supabase Project Initialization

1. Go to https://supabase.com/dashboard → New Project
2. **Name:** `eventology-v1`
3. **Region:** EU West (Ireland)
4. **Database Password:** Generate strong password, store in `.env.local`
5. Record the following in `.env.local`:

    ```
    NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
    SUPABASE_SERVICE_ROLE_KEY=eyJ...
    SUPABASE_DB_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
    ```

6. Install Supabase CLI: `npm install -g supabase`
7. Link project: `supabase link --project-ref xxxxx`
8. Apply migrations: `supabase db push`

### Task 0.5: Environment Variables Setup

Create `.env.local` at monorepo root:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=

# better-auth
BETTER_AUTH_SECRET=           # Generate: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

# Chapa
CHAPA_SECRET_KEY=             # From Chapa dashboard (test mode initially)
CHAPA_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=               # From Resend dashboard

# Africa's Talking
AT_API_KEY=                   # From Africa's Talking dashboard
AT_USERNAME=                  # Africa's Talking username
AT_SENDER_ID=Eventology       # SMS sender ID

# OpenRouter (AI)
OPENROUTER_API_KEY=           # From OpenRouter dashboard

# Expo Push
EXPO_ACCESS_TOKEN=            # For push notifications

# App
NEXT_PUBLIC_APP_URL=https://eventology-nu.vercel.app
```

**Day 0 Exit Criteria:**
- [ ] `mvp-demo` branch exists with demo code
- [ ] Expo demo built and shared with marketing team (or in progress)
- [ ] `main` branch has clean Turborepo monorepo structure
- [ ] Supabase project created with extensions enabled
- [ ] All environment variables documented
- [ ] `turbo run build` passes with zero errors

---

## 3. Week 1: Foundation & Schema (May 27–31)

> **Theme:** “The schema IS the architecture. Everything flows from it.”

### Day 1 (Tuesday): Database Schema & Migrations

**Morning: Author ALL migration files**

Execute in order. Every migration file is a separate `.sql` file in `supabase/migrations/`.

| Migration | Tables | Time Est. |
| --- | --- | --- |
| `001_extensions.sql` | Enable uuid-ossp, pgcrypto, postgis, pg_trgm | 5 min |
| `002_enums.sql` | All 20 enum types | 15 min |
| `003_users_profiles.sql` | profiles + indexes | 20 min |
| `004_organizers.sql` | organizers, organizer_team_members | 20 min |
| `005_categories_venues.sql` | categories, venues + GIS indexes | 20 min |
| `006_events.sql` | events + full-text search + GIS indexes | 30 min |
| `007_tickets_registrations.sql` | ticket_tiers, registrations, tickets | 25 min |
| `008_payments.sql` | payments, payouts | 20 min |
| `009_messaging.sql` | conversations, messages | 15 min |
| `010_reviews_ratings.sql` | reviews | 10 min |
| `011_sponsors.sql` | sponsors | 10 min |
| `012_notifications.sql` | notifications + unread index | 15 min |
| `013_analytics.sql` | event_views | 10 min |
| `014_audit_log.sql` | audit_log + indexes | 10 min |
| `015_promo_codes.sql` | promo_codes | 15 min |
| `016_rls_policies.sql` | All RLS policies for all tables | 45 min |
| `017_seed_data.sql` | Development seed data | 60 min |
| `018_ai_cache.sql` | ai_cache, ai_conversations, ai_messages tables | 20 min |

All SQL is provided in Part 1 §8. Copy exactly.

**Afternoon: Apply migrations & generate types**

```bash
# Apply all migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --project-id <ref> > packages/schemas/src/generated/database.types.ts

# Verify types generated correctly
```

### Day 2 (Wednesday): Zod Schemas & Shared Packages

**Morning: Author Zod schemas for every entity**

For each entity in `packages/schemas/src/entities/`:
1. Import the generated Row type from `database.types.ts`
2. Create a Zod schema with proper validation rules
3. Create `create`, `update`, and `list` schema variants
4. Export inferred TypeScript types

**Entity list (14 entities):** `event.ts`, `user.ts`, `registration.ts`, `ticket.ts`, `payment.ts`, `organizer.ts`, `category.ts`, `venue.ts`, `sponsor.ts`, `review.ts`, `message.ts`, `notification.ts`, `promo-code.ts`, `audit-log.ts`

**Afternoon: Author shared config and utils packages**

- `packages/config/src/query-keys.ts` — Query key factory for all 14 entities
- `packages/config/src/entity-config.ts` — API paths, search fields, sort defaults
- `packages/config/src/constants.ts` — Platform constants (commission rate, currency, etc.)
- `packages/utils/src/format.ts` — Date, currency (ETB), number formatters
- `packages/utils/src/validators.ts` — Ethiopian phone number, email validators
- `packages/utils/src/geo.ts` — Distance calculation, coordinate helpers

### Day 3 (Thursday): Authentication (better-auth)

**Full-day task: Set up better-auth across web and mobile**

```bash
# Install in apps/web
cd apps/web
npm install better-auth
```

**Implementation checklist:**
1. Create `apps/web/src/lib/auth.ts` — better-auth server configuration
2. Create `apps/web/src/lib/auth-client.ts` — client-side auth hooks
3. Configure PostgreSQL adapter pointing to Supabase database
4. Set up Email/Password authentication
5. Set up Phone OTP authentication
6. Create auth middleware (`apps/web/src/middleware.ts`)
7. Implement role-based route protection:
- `(public)/*` — no auth required
- `(organizer)/*` — requires `role: 'organizer'` or `role: 'admin'`
- `(admin)/*` — requires `role: 'admin'`
8. Create auth pages: `/auth/login`, `/auth/signup`, `/auth/forgot-password`
9. Create profile creation trigger (on signup → insert into `profiles` table)
10. Test login → session → protected route → logout flow

**Mobile auth (apps/mobile):**
1. Install `better-auth/react-native` adapter
2. Configure SecureStore for token persistence
3. Create auth context provider
4. Implement login/signup screens

### Day 4 (Friday): Design System & UI Primitives

**Carry forward the 20 UI primitives from the demo.**

These components already exist in the demo and should be migrated to `apps/web/src/components/ui/`:

| # | Component | File | Radix Dependency |
| --- | --- | --- | --- |
| 1 | Button | `button.tsx` | @radix-ui/react-slot |
| 2 | Card | `card.tsx` | None |
| 3 | Badge | `badge.tsx` | None |
| 4 | Input | `input.tsx` | None |
| 5 | Textarea | `textarea.tsx` | None |
| 6 | Select | `select.tsx` | @radix-ui/react-select |
| 7 | Dialog | `dialog.tsx` | @radix-ui/react-dialog |
| 8 | DropdownMenu | `dropdown-menu.tsx` | @radix-ui/react-dropdown-menu |
| 9 | Tabs | `tabs.tsx` | @radix-ui/react-tabs |
| 10 | Avatar | `avatar.tsx` | @radix-ui/react-avatar |
| 11 | Skeleton | `skeleton.tsx` | None |
| 12 | Separator | `separator.tsx` | @radix-ui/react-separator |
| 13 | Tooltip | `tooltip.tsx` | @radix-ui/react-tooltip |
| 14 | Switch | `switch.tsx` | @radix-ui/react-switch |
| 15 | Progress | `progress.tsx` | @radix-ui/react-progress |
| 16 | DataTable | `data-table.tsx` | None |
| 17 | Chart | `chart.tsx` | Recharts |
| 18 | Checkbox | `checkbox.tsx` | @radix-ui/react-checkbox |
| 19 | Label | `label.tsx` | None |
| 20 | FooterCTA | `FooterCTA.tsx` | None |

**New UI primitives needed for V1:**

| # | Component | Purpose |
| --- | --- | --- |
| 21 | FileUpload | Image/document upload with preview and drag-drop |
| 22 | RichTextEditor | Event description editor (TipTap or similar) |
| 23 | DateTimePicker | Event date/time selection |
| 24 | MultiSelect | Tag selection, category multi-filter |
| 25 | Stepper | Multi-step form wizard (event creation) |
| 26 | MapPicker | Venue location selection with Leaflet |
| 27 | QRCode | QR code display component (already have qrcode.react) |
| 28 | ChatWidget | AI chatbot floating widget |
| 29 | LanguageSwitcher | EN/AM toggle |
| 30 | NotificationBell | Header notification dropdown |
| 31 | SearchCombobox | Advanced search with AI suggestions |
| 32 | StarRating | Event review star input |
| 33 | StatCard | Dashboard metric card with trend indicator |
| 34 | EmptyState | Zero-data state illustrations |
| 35 | Pagination | Cursor-based pagination controls |

### Day 5 (Saturday — if working): AI Package Foundation

**Set up `packages/ai/` — the AI service layer**

1. Create `packages/ai/src/client.ts` — OpenRouter client with fallback chain
2. Create `packages/ai/src/prompts/` — System prompt templates for each AI function
3. Create `packages/ai/src/services/` — Individual AI service functions (18 functions per Part 3 §5.2)
4. Create `packages/ai/src/cache.ts` — AI response caching strategy
5. Create `packages/ai/src/types.ts` — Request/response types for all AI services
6. Test with a simple prompt to verify OpenRouter connectivity

**Week 1 Exit Criteria:**
- [ ] All 18 database migrations applied successfully
- [ ] TypeScript types generated from schema
- [ ] All 14 Zod entity schemas authored
- [ ] Shared packages (schemas, config, utils, locales, ai) initialized
- [ ] better-auth authentication working (login, signup, logout, role protection)
- [ ] 35 UI primitives available (20 migrated + 15 new)
- [ ] AI client package with OpenRouter connectivity verified
- [ ] `turbo run build` passes with zero errors

---

## 4. Week 2: Core Features & Discovery (June 2–6)

> **Theme:** “Build the golden template. Everything else follows.”

### Day 6 (Monday): Events Module — Golden Template

**This is the MOST IMPORTANT day of the project.** The Events module sets the pattern for all subsequent modules.

**Morning: Public Event Discovery**
1. `GET /api/public/events` — List events with pagination, filters (category, date, location, price, type)
2. Event listing page (`(public)/events/page.tsx`) — Grid layout with EventCard, filter sidebar
3. Event detail page (`(public)/events/[slug]/page.tsx`) — Full event view with banner, description, ticket tiers, organizer info, map, gallery, reviews, sponsors, AI-generated “Events Like This”
4. Featured events carousel on homepage

**Afternoon: Protected Event CRUD (Organizer)**
1. `POST /api/protected/events` — Create event
2. `PUT /api/protected/events/[id]` — Update event
3. `DELETE /api/protected/events/[id]` — Cancel event (soft delete)
4. Event creation wizard (multi-step form)
5. Event management list in organizer dashboard

**AI Integration (same day):**
- AI auto-tag suggestions on event creation
- AI event description generator (from bullet points)
- AI event summary for public display

### Day 7 (Tuesday): Registration & Ticketing

1. Ticket tier configuration (organizer creates tiers)
2. Registration flow (attendee selects tier → enters details → confirmation)
3. QR code ticket generation (using qrcode.react + unique signed payload)
4. Digital ticket page with downloadable QR
5. My Events / My Tickets page
6. Waitlist join flow (when event is at capacity)
7. Registration management for organizers (attendee list, search, filter, CSV export)

### Day 8 (Wednesday): Search, Categories & Venue

1. Smart search with traditional filters (keyword, category, date, location, price)
2. AI Natural Language Search (“tech events this weekend in Bole”)
3. Category grid with event counts
4. Category management for admin (CRUD)
5. Venue display on event detail (Leaflet map)
6. “Events Near Me” with GPS proximity (PostGIS `ST_DWithin`)

### Day 9 (Thursday): Mobile App — Core Screens

**Parallel mobile development catches up to web**

1. Home/Discovery tab (matches web homepage)
2. Event detail screen
3. Search tab
4. My Tickets tab
5. Auth screens (login/signup)
6. Bottom tab navigation
7. Shared Supabase client with AsyncStorage
8. Push notification token registration

### Day 10 (Friday): Reviews, Ratings & Social

1. Post-event review submission (star rating + text)
2. Review display on event detail page
3. Review moderation (admin approval queue)
4. Social sharing with dynamic OG image generation
5. Calendar integration (ICS file generation, Google/Apple Calendar deep links)
6. Event cloning / templating for organizers
7. Recurring event series (parent-child event model)

**Week 2 Exit Criteria:**
- [ ] Events CRUD working end-to-end (create → list → detail → edit → cancel)
- [ ] Registration flow complete (select tier → register → QR ticket)
- [ ] Search working (traditional + AI natural language)
- [ ] Categories and venue map displayed
- [ ] Mobile app has 5 core screens functional with real data
- [ ] Reviews and ratings system working
- [ ] Social sharing with OG images
- [ ] Calendar integration working
- [ ] `turbo run build` passes with zero errors

---

## 5. Week 3: Payments, AI & Communication (June 9–13)

> **Theme:** “Money flows, AI thinks, messages deliver.”

### Day 11 (Monday): Chapa Payment Integration

1. Chapa client wrapper (`packages/utils/src/chapa.ts`)
2. Payment initialization endpoint (`POST /api/protected/payments/init`)
3. Chapa checkout redirect flow
4. Webhook handler (`POST /api/webhooks/chapa`) with signature verification
5. Payment verification and ticket creation on success
6. Payment records in database
7. Commission calculation: `platform_fee = amount * commission_rate / 100`
8. Test with Chapa test mode

### Day 12 (Tuesday): Revenue & Payout Dashboard

1. Organizer revenue dashboard (total revenue, commission breakdown, pending payouts)
2. Payout history and tracking
3. Refund management (organizer initiates → admin approves)
4. Revenue analytics (per-event revenue, trends over time)
5. Admin platform-wide revenue reporting
6. Promo code management (create, edit, deactivate, track usage)
7. Promo code application at checkout

### Day 13 (Wednesday): Communication Stack

**Email (Resend):**
1. Supabase Edge Function for email sending
2. React Email templates (registration confirmation, reminders, payment receipt, etc.)
3. 24-hour and 1-hour event reminder scheduling (Supabase cron)

**SMS (Africa’s Talking):**
4. Supabase Edge Function for SMS
5. Ethiopian phone number formatting
6. SMS templates (registration, reminders, waitlist promotion)

**Push Notifications (Expo):**
7. Supabase Edge Function for Expo Push
8. Notification triggers (registration, reminder, cancellation, payment)
9. Deep linking from notification → specific screen

**In-App Notifications:**
10. Notification bell component with unread count
11. Notification list page
12. Real-time notification delivery via Supabase Realtime

### Day 14 (Thursday): AI Integration Full Deployment

**Deploy ALL AI features across all tiers:**

**Public Tier:**
- AI Discovery Chatbot (floating widget)
- AI Event Recommendations (“Recommended For You”)
- AI Event Summarizer (TL;DR button)
- AI “Events Like This” on detail pages

**Organizer Tier:**
- AI Event Description Generator
- AI Marketing Copy Generator
- AI Pricing Optimizer
- AI Analytics Narrator
- AI Performance Predictor
- AI Organizer Chatbot

**Admin Tier:**
- AI Content Moderation (auto-scan new events)
- AI Fraud Detection
- AI Platform Health Monitor
- AI Audit Log Analyzer
- AI Trending Events Detection
- AI Report Generator
- AI Customer Support Bot

**Platform-Wide:**
- AI Translation Service (EN↔︎AM)
- AI Workflow Agents (reminders, waitlist, moderation, recap, stale drafts, trending)

### Day 15 (Friday): Messaging & i18n

1. Organizer → attendee messaging (broadcast to event registrants)
2. Conversation view with real-time updates (Supabase Realtime)
3. i18n framework setup (next-intl for web, expo-localization for mobile)
4. EN/AM locale files with all UI strings
5. Language switcher component
6. AI-powered content translation for event descriptions
7. Mobile: push notification handling, offline ticket caching

**Week 3 Exit Criteria:**
- [ ] Chapa payment flow working end-to-end (pay → webhook → ticket)
- [ ] Revenue dashboard showing real payment data
- [ ] Refund and promo code flows working
- [ ] Email, SMS, and push notifications sending successfully
- [ ] ALL AI features deployed and functional across 3 tiers
- [ ] AI chatbot responding on all pages
- [ ] Messaging system working with real-time delivery
- [ ] i18n framework with EN/AM switching
- [ ] `turbo run build` passes with zero errors

---

## 6. Week 4: Dashboards, Polish & Launch (June 16–22)

> **Theme:** “Make it bulletproof. Make it beautiful. Ship it.”

### Day 16 (Monday): Admin Panel Completion

1. Moderation queue (pending events, approve/reject/request changes)
2. Featured events management (pin/unpin, set duration)
3. User management (list, search, filter by role, activate/deactivate)
4. Organizer verification workflow (application review, approve/reject)
5. Platform analytics dashboard (total events, registrations, users, revenue, growth)
6. Audit log viewer with search and filters
7. Platform-wide announcements

### Day 17 (Tuesday): Organizer Dashboard Completion

1. Organizer profile management
2. Live check-in dashboard with real-time counter (Supabase Realtime)
3. QR check-in system (web: camera scanner component, mobile: native expo-camera)
4. Per-event analytics with AI narration
5. Team management (invite members, assign roles)
6. Sponsor management (CRUD sponsors, track impressions/clicks)
7. Draft & preview mode for events

### Day 18 (Wednesday): Mobile App Completion

1. Payment flow in mobile (Chapa web view)
2. QR scanner screen (expo-camera barcode)
3. Offline ticket caching (AsyncStorage)
4. Push notification handling
5. “Events Near Me” with GPS (expo-location)
6. Profile & settings screen
7. Organizer mobile views (event list, check-in scanner, basic analytics)

### Day 19 (Thursday): Seed Data & Testing Setup

**Priority 0 — Testing is non-negotiable.**

1. **Comprehensive seed data generation:**
    - 50+ events across 8 categories, 6 Ethiopian cities
    - 10+ organizers (mix of verified/unverified/pending)
    - 200+ registrations (confirmed, checked-in, cancelled, waitlisted)
    - 30+ payments (completed, refunded, pending)
    - 20+ reviews with varied ratings
    - 5+ promo codes (active, expired, usage-limited)
    - 50+ audit log entries
    - 30+ notifications (read/unread)
    - Sample conversations and messages
2. **Unit tests:**
    - Zod schema validation tests (valid + invalid inputs)
    - Utility function tests (formatters, validators, geo helpers)
    - AI service function tests (mock OpenRouter responses)
3. **Integration tests:**
    - Auth flow (signup → login → session → role check → logout)
    - Event CRUD (create → list → detail → update → cancel)
    - Registration flow (register → ticket generation → QR validation)
    - Payment flow (init → webhook → ticket creation → commission calculation)
    - Waitlist flow (register → full → waitlist → cancel → auto-promote)

### Day 20 (Friday): Full QA & Polish

1. **Cross-browser testing:** Chrome, Firefox, Safari, Edge
2. **Mobile device testing:** iOS (iPhone), Android (various sizes)
3. **Responsive audit:** All pages at 320px, 375px, 768px, 1024px, 1440px
4. **Performance audit:** Lighthouse score ≥90 on all metrics
5. **Accessibility audit:** Tab navigation, screen reader, color contrast
6. **Error state coverage:** Every form has proper error messages
7. **Empty state coverage:** Every list/grid has proper zero-data state
8. **Loading state coverage:** Every async operation shows loading indicator
9. **Animation polish:** All transitions smooth, no jank
10. **Final design review:** Match the approved demo aesthetic

### Day 21–22 (Weekend): Launch Prep & Deployment

1. **Production environment variables set on Vercel**
2. **Supabase production settings verified** (RLS enabled, storage policies set)
3. **Chapa switched to production mode** (if ready)
4. **DNS/domain configuration** (eventology-nu.vercel.app as production)
5. **Monitoring setup:** Vercel analytics, error tracking
6. **Final `turbo run build`** — must pass with ZERO errors and ZERO warnings
7. **Deploy to production**
8. **Mobile app:** EAS Build for internal distribution (TestFlight + Play Store internal)
9. **Smoke test all critical paths on production**

---

## 7. Testing & Verification Matrix

> **Priority 0 — No feature ships without verification.**

| Test Type | Scope | Tool | When |
| --- | --- | --- | --- |
| **Type Safety** | All packages | TypeScript strict mode | Continuous |
| **Schema Validation** | All entity schemas | Zod + Vitest | After schema authoring |
| **Unit Tests** | Utilities, formatters, validators | Vitest | After each utility module |
| **Integration Tests** | API endpoints | Vitest + supertest | After each API route |
| **Component Tests** | UI primitives | Vitest + React Testing Library | After each component |
| **E2E Tests** | Critical user flows | Playwright | End of Week 3 |
| **Manual QA** | All pages, all viewports | Browser DevTools | End of Week 4 |
| **Mobile Testing** | All screens | Expo Go + physical devices | Continuous |
| **AI Testing** | All AI service functions | Mock responses + live tests | After each AI feature |
| **Performance** | All pages | Lighthouse CI | End of Week 4 |
| **Security** | Auth, RLS, API | Manual audit | End of Week 4 |

### Critical Path Tests (Must Pass Before Launch)

```
✅ User can sign up, log in, and see role-appropriate content
✅ User can browse events, search, filter
✅ User can register for a free event and receive QR ticket
✅ User can pay for a paid event via Chapa and receive QR ticket
✅ Organizer can create, edit, clone, and cancel events
✅ Organizer can view registrations and check in attendees via QR scan
✅ Organizer can view revenue and request payouts
✅ Admin can approve/reject events
✅ Admin can verify organizers
✅ Admin can view platform analytics
✅ AI chatbot responds accurately on all tiers
✅ Email, SMS, and push notifications deliver
✅ Mobile app mirrors web functionality
✅ i18n works (EN ↔ AM switch)
✅ Offline ticket access works on mobile
```

---

## 8. Risk Register

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| OpenRouter free models rate-limited or unavailable | MEDIUM | HIGH | 8-model fallback chain + response caching (24h TTL) |
| Chapa API downtime during testing | LOW | HIGH | Use Chapa test mode; mock payment flow as fallback |
| Africa’s Talking Ethiopian SMS delivery issues | MEDIUM | MEDIUM | Afro Message as fallback; email as ultimate fallback |
| Supabase free tier limitations | LOW | MEDIUM | Monitor usage; upgrade plan if needed |
| better-auth + Supabase RLS integration complexity | MEDIUM | HIGH | Test RLS policies independently; document auth↔︎RLS bridge pattern |
| Expo build failures on EAS | LOW | MEDIUM | Test builds early in Week 1; maintain simple native module list |
| Scope creep from AI feature complexity | MEDIUM | MEDIUM | AI features have clear scope in Part 3; defer enhancements to V2 |
| PostGIS spatial query performance | LOW | LOW | Index optimization; limit radius to 50km default |

---

## 9. Milestone Checklist

| Milestone | Target Date | Gate Criteria |
| --- | --- | --- |
| **M0: Day 0 Complete** | May 26 | Branches set, monorepo initialized, Supabase project live |
| **M1: Schema Complete** | May 28 | All migrations applied, types generated, schemas authored |
| **M2: Auth Working** | May 29 | Login, signup, role protection functional |
| **M3: Golden Template** | June 2 | Events CRUD end-to-end, golden template established |
| **M4: Registration Flow** | June 3 | Register → ticket → QR complete |
| **M5: Mobile Core** | June 5 | 5 mobile screens functional with real data |
| **M6: Payments Live** | June 9 | Chapa flow working in test mode |
| **M7: AI Deployed** | June 12 | All AI features functional across 3 tiers |
| **M8: Communications** | June 13 | Email + SMS + push delivering |
| **M9: Admin Complete** | June 16 | Full admin panel functional |
| **M10: Testing Pass** | June 19 | All critical path tests passing |
| **M11: Production Deploy** | June 22 | V1 live on production |

---

> **Next Document:** V1_MASTER_PART5_HANDOVER.md — Cross-agent session handover protocol with startup messages and session resumption instructions.

---

*Eventology V1 MVP — Master Timeline & Execution Plan Part 4 of 5*

*© 2026 VersaLabs Studio. All rights reserved.*
