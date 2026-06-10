# Eventology V1 MVP — Master Architecture Document (Part 1 of 5)

> **Author:** Kidus Abdula — Lead SWE & Systems Architect
>
> **Version:** 1.1.0
>
> **Created:** May 24, 2026
>
> **Last Updated:** May 25, 2026
>
> **Classification:** Master Source of Truth — Cross-Agent Session Handover
>
> **Timeline:** 4-Week Development Window (May 26 – June 22, 2026)
>
> **Status:** ✅ ARCHITECT APPROVED — All open questions resolved
>
> **Platform Identity:** AI-NATIVE LLM-POWERED EVENT MANAGEMENT SYSTEM

<!-- RECOVERY NOTE (2026-06-10): This document was lost from the repo when an agent
discarded the docs/ master set; restored verbatim from Kidus's Notion backup by the
brain harness. Source of truth — do not casually edit. -->

---

## Table of Contents

1. Executive Summary
2. Plan Assessment & Gap Analysis
3. Pre-Implementation Tasks
4. Repository Strategy
5. Monorepo Topology
6. Infrastructure & Backend
7. DDD Bounded Contexts
8. Database Schema (PostgreSQL / Supabase)
9. Generated Types & Validation Layer
10. API Architecture
11. Authentication & Authorization
12. Open Questions for Architect

---

## 1. Executive Summary

### 1.1 What We’re Building

Eventology V1 is a **full-stack, AI-native, production-grade event management platform** serving Ethiopia nationally. It comprises:

- **Web Application** — Next.js 16 (App Router), the primary platform interface
- **Mobile Application** — Expo (React Native), iOS & Android, developed in parallel
- **Backend** — Supabase (PostgreSQL, Storage, Realtime, Edge Functions)
- **Authentication** — better-auth (PostgreSQL-backed sessions, NOT Supabase Auth)
- **AI Engine** — OpenRouter with 8-model free-tier fallback chain
- **Shared Logic** — Turborepo monorepo with shared schemas, types, and validation

### 1.2 What Changed From the Original Plan

The original BUSINESS_RESPONSE_V1.md scoped V1 as a 4-week web-only MVP with payments, mobile, SMS, Amharic, and advanced features deferred to V2. **By stakeholder directive, the following V2 tracks are now absorbed into V1:**

| Originally Deferred Feature | V1 Status | Notes |
| --- | --- | --- |
| Chapa payment integration | **V1 — INCLUDED** | Chapa-first; Telebirr deferred to V2 |
| Platform commission on paid tickets | **V1 — INCLUDED** | Configurable percentage per organizer tier |
| Organizer payout dashboard | **V1 — INCLUDED** | Settlement tracking, payout history |
| Refund management | **V1 — INCLUDED** | Request/approve flow with audit trail |
| Revenue analytics | **V1 — INCLUDED** | Per-event and platform-wide revenue dashboards |
| iOS & Android app via Expo | **V1 — INCLUDED** | Parallel development, shared schema layer |
| Push notifications | **V1 — INCLUDED** | Expo Notifications + Supabase Edge Functions |
| Native QR scanner | **V1 — INCLUDED** | expo-camera barcode scanning |
| Offline ticket access | **V1 — INCLUDED** | Local storage persistence for digital tickets |
| “Events near me” with GPS | **V1 — INCLUDED** | expo-location + PostGIS proximity queries |
| SMS notifications | **V1 — INCLUDED** | Via Supabase Edge Functions + Afro Message / Africa’s Talking gateway |
| Amharic language support | **V1 — INCLUDED** | i18n framework with EN/AM locale files |
| Organizer → attendee messaging | **V1 — INCLUDED** | In-platform messaging via Supabase Realtime |
| Calendar integration (Google/Apple) | **V1 — INCLUDED** | ICS file generation + deep links |
| Recurring events | **V1 — INCLUDED** | Weekly/monthly series with parent-child event model |
| Seat maps for large venues | **V2 — DEFERRED** | Interactive SVG seat maps deferred per architect directive |
| Sponsor management | **V1 — INCLUDED** | Sponsor tiers, logo placement, analytics |
| AI-powered event recommendations | **V1 — INCLUDED** | Full AI-native LLM-powered platform via OpenRouter |
| Advanced analytics | **V1 — INCLUDED** | AI-narrated cohort analysis, retention metrics, predictions |

### 1.3 Architect-Recommended Additional Features

Based on competitive analysis against Eventbrite, Lu.ma, Partiful, and the Ethiopian market gap identified in BUSINESS_RESPONSE_V1.md, the following features are **recommended inclusions** to double the feature scope and establish market dominance:

| Feature | Justification | Priority |
| --- | --- | --- |
| **Waitlist management with auto-promotion** | When cancellations occur, next-in-line attendees auto-promoted + notified | HIGH |
| **Event cloning / templating** | Organizers duplicate past events as templates — massive time saver | HIGH |
| **Multi-language event content** | Event descriptions in both EN and AM (not just UI chrome) | MEDIUM |
| **Social sharing with OG meta** | Dynamic OpenGraph images per event for rich social previews | HIGH |
| **Organizer verification workflow** | Application → document upload → admin review → verified badge | HIGH |
| **Attendee check-in dashboard (live)** | Real-time check-in counter with Supabase Realtime subscriptions | HIGH |
| **Event review/rating system** | Post-event attendee feedback with star ratings | MEDIUM |
| **Promo codes / discount tiers** | Organizer-created discount codes with usage limits and expiry | HIGH |
| **CSV bulk import for registrations** | Enterprise organizers import pre-registered attendee lists | MEDIUM |
| **Webhook integrations** | Notify external systems on registration, check-in, payment events | LOW |
| **Platform-wide announcements** | Admin broadcasts system-wide notifications | MEDIUM |
| **Event gallery / media uploads** | Multi-image galleries for events with Supabase Storage | HIGH |
| **Organizer team management** | Multiple team members per organizer account with role-based permissions | MEDIUM |

---

## 2. Plan Assessment & Gap Analysis

### 2.1 What the Architect Got Right

1. **Demo-first validation** — The UI/UX approval before full-stack build is textbook product development. Zero wasted engineering effort.
2. **National scope from day one** — Regional hub distribution (Addis, Hawassa, Bahir Dar) is already seeded in mock data.
3. **Supabase for MVP infrastructure** — Correct call. Managed PostgreSQL + Auth + Storage + Realtime eliminates 3-4 weeks of backend plumbing.
4. **Schema-first methodology** — Per ARCHITECTURAL_DNA.md P1. Non-negotiable.
5. **Turborepo monorepo** — Required for shared schemas between web and Expo.

### 2.2 Gaps Identified & Filled

| Gap | Risk If Unaddressed | Resolution |
| --- | --- | --- |
| **No Supabase project specification** | Agents will guess at configuration | Part 1 §6 specifies exact Supabase project setup, RLS policies, and Edge Function architecture |
| **No payment provider integration spec** | Chapa/Telebirr have specific webhook flows | Part 3 includes full payment integration architecture with webhook handlers |
| **No i18n strategy defined** | Amharic support becomes a retrofit nightmare | Part 2 specifies next-intl for web, expo-localization for mobile, shared locale JSON files |
| **No real-time architecture** | Check-in dashboard, messaging will fail under load | Part 1 §6 specifies Supabase Realtime channels with topic-based subscriptions |
| **No file storage strategy** | Event banners, organizer avatars, gallery images undefined | Part 1 §6 specifies Supabase Storage buckets with signed URL generation |
| **No email service specified** | Branded emails, reminders need a transactional provider | Resend or Supabase Edge Functions + SMTP relay (recommend Resend for DX) |
| **No SMS gateway specified** | SMS notifications need a provider | Africa’s Talking or Afro Message — both have Ethiopian SMS routes |
| **Expo demo build is not specified** | Marketing team needs a mobile demo before full V1 | Part 1 §3 defines the Expo demo as a pre-implementation task on mvp-demo branch |
| **No CI/CD pipeline** | Deployment is manual and error-prone | GitHub Actions for web (Vercel auto-deploy) + EAS Build for Expo |
| **No environment variable strategy** | Secrets leak or are inconsistent across environments | `.env.local`, `.env.production` with Supabase keys, Chapa keys, Resend keys |
| **PostGIS not mentioned** | “Events near me” requires spatial queries | Enable PostGIS extension in Supabase for proximity searches |

---

## 3. Pre-Implementation Tasks

> **CRITICAL:** These tasks must be completed BEFORE any V1 implementation begins.

### Task 0: Branch Strategy Execution

```
CURRENT STATE:
  main ← Contains the approved UI demo (mock data, no backend)

STEP 1: Create mvp-demo branch from current main
  $ git checkout -b mvp-demo
  $ git push origin mvp-demo

STEP 2: Build Expo demo on mvp-demo branch
  - Initialize Expo project inside the repo (at /mobile or /apps/mobile)
  - Port the homepage, event discovery, and event detail screens
  - Use the same mock data layer from the web demo
  - Deploy via EAS Build (internal distribution) for marketing team review
  - This is a DEMO ONLY — no backend, no auth, mock data only

STEP 3: Reset main for V1 implementation
  - After mvp-demo branch is pushed and verified:
  $ git checkout main
  - Initialize clean Turborepo monorepo structure on main
  - The demo continues to live on mvp-demo and remains deployed on Vercel
  - V1 development proceeds on main with clean architecture
```

### Task 1: Expo Demo for Marketing Team (mvp-demo branch)

**Scope:** A standalone Expo app that mirrors the demo’s public-facing screens with mock data. This satisfies the marketing team’s request for a mobile demo while V1 is being architected.

**Screens to port:**
1. Home / Discovery (featured carousel, category grid, upcoming events)
2. Event Detail (banner, description, ticket tiers, organizer info)
3. Search (keyword + category filter)
4. My Events / Tickets (mock ticket with QR code display)

**Tech:**
- Expo SDK 52+ with Expo Router (file-based routing)
- React Native Reanimated for animations
- Same design tokens as web (adapted for RN)
- Mock data imported directly from `src/lib/mock-data/`

**Deliverable:** EAS Build internal distribution link sent to marketing team.

### Task 2: Supabase Project Initialization

1. Create Supabase project (production region: EU West or closest to Ethiopia)
2. Enable extensions: `uuid-ossp`, `pgcrypto`, `postgis`, `pg_trgm` (full-text search)
3. Configure Auth providers: Email/Password, Phone (OTP)
4. Create Storage buckets: `avatars`, `event-banners`, `event-gallery`, `documents`
5. Set up RLS policies (defined in Part 1 §11)
6. Create service role key for Edge Functions

### Task 3: Turborepo Monorepo Initialization

Execute on clean `main` branch after demo is moved to `mvp-demo`.

---

## 4. Repository Strategy

### 4.1 Branch Model

| Branch | Purpose | Deployed To |
| --- | --- | --- |
| `mvp-demo` | Approved UI demo + Expo demo (mock data) | Vercel (demo preview) |
| `main` | V1 MVP production code | Vercel (https://eventology-nu.vercel.app/) |
| `develop` | Integration branch for V1 features | Vercel Preview Deployments |
| `feature/*` | Individual feature branches | PR previews |

> **Operational note (2026-06-10):** the live repo uses **`dev`** as the integration
> branch (not `develop`). Treat `dev` as the canonical alias of the `develop` role
> described here. See `HANDOFF_OVERHAUL_AESTHETIC_RESILIENCY.md` and the brain's
> git-workflow memory.

### 4.2 Commit Convention

```
feat: Add event creation form with ticket tier configuration
fix: Resolve QR scanner camera permission flow on Android
docs: Update schema migration notes for recurring events
chore: Upgrade Expo SDK to 52.1
```

---

## 5. Monorepo Topology

```
eventology/
├── apps/
│   ├── web/                          # Next.js 16 (App Router)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (public)/         # Tier 1: Public discovery
│   │   │   │   ├── (organizer)/      # Tier 2: Organizer dashboard
│   │   │   │   ├── (admin)/          # Tier 3: Admin panel
│   │   │   │   ├── api/
│   │   │   │   │   ├── public/       # Unauthenticated read-only endpoints
│   │   │   │   │   ├── protected/    # Authenticated CRUD endpoints
│   │   │   │   │   └── webhooks/     # Chapa/Telebirr webhook handlers
│   │   │   │   ├── layout.tsx
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Design system primitives (carry from demo)
│   │   │   │   ├── public/           # Tier 1 domain components
│   │   │   │   ├── dashboard/        # Tier 2 domain components
│   │   │   │   ├── admin/            # Tier 3 domain components
│   │   │   │   └── shared/           # Cross-tier shared components
│   │   │   ├── hooks/                # Web-specific hooks
│   │   │   ├── lib/                  # Web utilities, Supabase client
│   │   │   └── config/               # Entity configs, query keys, constants
│   │   ├── public/                   # Static assets (logo, favicon)
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mobile/                       # Expo (React Native)
│       ├── app/                      # Expo Router file-based routing
│       │   ├── (tabs)/               # Bottom tab navigator
│       │   │   ├── index.tsx          # Home / Discovery
│       │   │   ├── search.tsx         # Search
│       │   │   ├── tickets.tsx        # My Tickets
│       │   │   └── profile.tsx        # Profile / Settings
│       │   ├── event/[slug].tsx       # Event detail
│       │   ├── register/[id].tsx      # Registration flow
│       │   ├── scanner.tsx            # QR scanner (organizers)
│       │   ├── auth/
│       │   │   ├── login.tsx
│       │   │   └── signup.tsx
│       │   └── _layout.tsx
│       ├── components/               # Mobile-specific components
│       ├── hooks/                    # Mobile-specific hooks
│       ├── lib/                      # Supabase client, storage helpers
│       ├── assets/                   # Images, fonts
│       ├── locales/                  # i18n locale files (shared reference)
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── schemas/                      # SHARED: Zod schemas + generated types
│   │   ├── src/
│   │   │   ├── entities/             # Per-entity schema files
│   │   │   │   ├── event.ts
│   │   │   │   ├── user.ts
│   │   │   │   ├── registration.ts
│   │   │   │   ├── ticket.ts
│   │   │   │   ├── payment.ts
│   │   │   │   ├── organizer.ts
│   │   │   │   ├── category.ts
│   │   │   │   ├── venue.ts
│   │   │   │   ├── sponsor.ts
│   │   │   │   ├── review.ts
│   │   │   │   ├── message.ts
│   │   │   │   ├── notification.ts
│   │   │   │   ├── promo-code.ts
│   │   │   │   └── audit-log.ts
│   │   │   ├── enums.ts              # Shared enums (status, role, etc.)
│   │   │   └── index.ts              # Barrel export
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── config/                       # SHARED: Entity configurations
│   │   ├── src/
│   │   │   ├── query-keys.ts         # Query key factory
│   │   │   ├── entity-config.ts      # API paths, search fields, labels
│   │   │   └── constants.ts          # Platform-wide constants
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── utils/                        # SHARED: Pure utility functions
│   │   ├── src/
│   │   │   ├── format.ts             # Date, currency, number formatters
│   │   │   ├── validators.ts         # Phone, email, ETB validators
│   │   │   └── geo.ts                # Distance calculation, coordinate helpers
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── locales/                      # SHARED: i18n translation files
│       ├── en.json
│       ├── am.json
│       ├── package.json
│       └── tsconfig.json
│
├── supabase/
│   ├── migrations/                   # SQL migration files (schema-first)
│   │   ├── 001_extensions.sql
│   │   ├── 002_enums.sql
│   │   ├── 003_users_profiles.sql
│   │   ├── 004_organizers.sql
│   │   ├── 005_categories_venues.sql
│   │   ├── 006_events.sql
│   │   ├── 007_tickets_registrations.sql
│   │   ├── 008_payments.sql
│   │   ├── 009_messaging.sql
│   │   ├── 010_reviews_ratings.sql
│   │   ├── 011_sponsors.sql
│   │   ├── 012_notifications.sql
│   │   ├── 013_analytics.sql
│   │   ├── 014_audit_log.sql
│   │   ├── 015_promo_codes.sql
│   │   ├── 016_rls_policies.sql
│   │   └── 017_seed_data.sql
│   ├── functions/                    # Supabase Edge Functions
│   │   ├── send-email/               # Transactional email via Resend
│   │   ├── send-sms/                 # SMS via Africa's Talking
│   │   ├── process-payment/          # Chapa webhook handler
│   │   ├── generate-qr/              # QR code generation
│   │   ├── push-notification/        # Expo push notification sender
│   │   ├── auto-promote-waitlist/    # Waitlist auto-promotion logic
│   │   ├── generate-og-image/        # Dynamic OpenGraph image generation
│   │   └── ai-recommendations/       # Event recommendation engine
│   ├── seed.sql                      # Development seed data
│   └── config.toml                   # Supabase local dev config
│
├── turbo.json                        # Turborepo pipeline config
├── package.json                      # Root workspace config
├── tsconfig.base.json                # Shared TS config
├── .env.local                        # Local development secrets
├── .env.production                   # Production secrets (gitignored)
├── .gitignore
└── docs/                             # Architecture & handover documentation
    ├── V1_MASTER_PART1_ARCHITECTURE.md     # THIS DOCUMENT
    ├── V1_MASTER_PART2_FEATURES.md         # Feature specifications & UI mapping
    ├── V1_MASTER_PART3_INTEGRATIONS.md     # Payment, SMS, email, push, i18n
    ├── V1_MASTER_PART4_TIMELINE.md         # Week-by-week execution plan
    └── V1_MASTER_PART5_HANDOVER.md         # Agent session handover protocol
```

---

## 6. Infrastructure & Backend

### 6.1 Supabase Configuration

| Resource | Configuration |
| --- | --- |
| **Database** | PostgreSQL 15+ with extensions: `uuid-ossp`, `pgcrypto`, `postgis`, `pg_trgm` |
| **Auth** | better-auth with PostgreSQL adapter (Email/Password + Phone OTP) — NOT Supabase Auth |
| **Storage Buckets** | `avatars` (1MB, image/*), `event-banners` (5MB, image/*), `event-gallery` (5MB, image/*), `documents` (10MB, pdf/image) |
| **Realtime** | Enabled for: `registrations`, `check_ins`, `messages`, `notifications` |
| **Edge Functions** | Deno runtime for: email, SMS, payment webhooks, QR generation, push notifications, AI recommendations |
| **Row Level Security** | Mandatory on ALL tables — no exceptions |

### 6.2 External Service Dependencies

| Service | Purpose | Provider | Notes |
| --- | --- | --- | --- |
| **Payments** | Online ticket purchases | Chapa (primary only for V1) | Telebirr deferred to V2; Chapa-first per architect directive |
| **Email** | Transactional emails (confirmations, reminders) | Resend | Best DX, React Email for templates, generous free tier |
| **SMS** | Registration confirmations, reminders | Africa’s Talking (ET SMS routes) | Afro Message as fallback |
| **Push Notifications** | Mobile app notifications | Expo Push Notifications | Free, native to Expo ecosystem |
| **File Storage** | Images, documents | Supabase Storage | Already included in Supabase project |
| **Hosting (Web)** | Next.js deployment | Vercel | Current demo already deployed here |
| **Hosting (Mobile)** | App builds & distribution | EAS Build (Expo) | Internal distribution for testing, App Store/Play Store for production |
| **Maps** | Venue location display | Leaflet (OSM) for web, react-native-maps for mobile | Free, no API key required for basic tiles |
| **Analytics (Internal)** | Platform metrics | Custom PostgreSQL views + materialized views | No external analytics dependency |

### 6.3 Supabase Client Architecture

```
Web (Next.js):
  - Server Components → createServerClient() (from @supabase/ssr)
  - Client Components → createBrowserClient() (from @supabase/ssr)
  - API Routes → createRouteHandlerClient() (from @supabase/ssr)
  - Middleware → createMiddlewareClient() (for auth session refresh)

Mobile (Expo):
  - AsyncStorage adapter → createClient() (from @supabase/supabase-js)
  - Auth persistence via SecureStore (expo-secure-store)
```

---

## 7. DDD Bounded Contexts

Per ARCHITECTURAL_DNA.md §7.1, every feature boundary is isolated. The following bounded contexts define the V1 domain:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EVENTOLOGY V1 BOUNDED CONTEXTS                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   IDENTITY   │  │   DISCOVERY  │  │   TICKETING  │               │
│  │              │  │              │  │              │               │
│  │ • Users      │  │ • Events     │  │ • Tickets    │               │
│  │ • Profiles   │  │ • Categories │  │ • Tiers      │               │
│  │ • Roles      │  │ • Search     │  │ • QR Codes   │               │
│  │ • Auth       │  │ • Venues     │  │ • Waitlist   │               │
│  │ • Organizers │  │ • Recurring  │  │ • Promo Codes│               │
│  │ • Teams      │  │ • Geo/GPS    │  │ • Seat Maps  │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   PAYMENTS   │  │ COMMUNICATION│  │  ANALYTICS   │               │
│  │              │  │              │  │              │               │
│  │ • Chapa      │  │ • Email      │  │ • Views      │               │
│  │ • Telebirr   │  │ • SMS        │  │ • Revenue    │               │
│  │ • Commission │  │ • Push       │  │ • Cohorts    │               │
│  │ • Payouts    │  │ • Messaging  │  │ • Retention  │               │
│  │ • Refunds    │  │ • Calendar   │  │ • Predictions│               │
│  │ • Invoices   │  │ • i18n       │  │ • Audit Log  │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐                                  │
│  │   SPONSORS   │  │  MODERATION  │                                  │
│  │              │  │              │                                  │
│  │ • Tiers      │  │ • Queue      │                                  │
│  │ • Logos      │  │ • Reviews    │                                  │
│  │ • Placement  │  │ • Ratings    │                                  │
│  │ • Analytics  │  │ • Flags      │                                  │
│  │              │  │ • Verify Org │                                  │
│  └──────────────┘  └──────────────┘                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Database Schema (PostgreSQL / Supabase)

> **Methodology:** Schema-First per ARCHITECTURAL_DNA.md §5.
>
> **Rule:** These SQL migrations are authored and reviewed BEFORE any application code is written.

### 8.1 Extension Setup (Migration 001)

```sql
-- 001_extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### 8.2 Enum Definitions (Migration 002)

```sql
-- 002_enums.sql
CREATE TYPE user_role AS ENUM ('attendee', 'organizer', 'admin');
CREATE TYPE event_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'cancelled', 'completed');
CREATE TYPE event_type AS ENUM ('conference', 'workshop', 'meetup', 'seminar', 'networking', 'concert', 'exhibition', 'training', 'webinar', 'festival');
CREATE TYPE ticket_type AS ENUM ('free', 'paid');
CREATE TYPE ticket_status AS ENUM ('valid', 'used', 'cancelled', 'expired', 'refunded');
CREATE TYPE registration_status AS ENUM ('confirmed', 'cancelled', 'checked_in', 'waitlisted', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_provider AS ENUM ('chapa', 'telebirr', 'free');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app');
CREATE TYPE notification_type AS ENUM ('registration_confirm', 'event_reminder_24h', 'event_reminder_1h', 'event_approved', 'event_rejected', 'payment_confirm', 'refund_processed', 'waitlist_promoted', 'organizer_message', 'system_announcement');
CREATE TYPE organizer_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE sponsor_tier AS ENUM ('platinum', 'gold', 'silver', 'bronze');
CREATE TYPE recurrence_pattern AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');
CREATE TYPE moderation_action AS ENUM ('approve', 'reject', 'feature', 'unfeature', 'suspend', 'verify', 'unverify');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'hidden');
CREATE TYPE promo_code_type AS ENUM ('percentage', 'fixed_amount');
CREATE TYPE seat_status AS ENUM ('available', 'reserved', 'sold', 'blocked');
```

### 8.3 Core Tables (Migrations 003–015)

> **Note to implementing agent:** Each migration file below is a separate `.sql` file in `supabase/migrations/`. Execute in order. All `id` columns use `uuid` with `gen_random_uuid()` default. All tables include `created_at` and `updated_at` with auto-updating triggers.

<!-- RECOVERY NOTE: The Notion source for Part 1 §8.3 carried the table-by-table DDL
inline in the original architecture pass; the recovered copy preserves the methodology
note above but the per-table CREATE statements are not in this backup. The applied,
authoritative schema lives in `supabase/migrations/*.sql` on disk (001–018). Treat the
migration files as canonical; regenerate types from them per §9. -->

---

## 9. Generated Types & Validation Layer

Per ARCHITECTURAL_DNA.md §5.1, types are **generated from the schema, never handwritten**.

### 9.1 Generation Strategy

```
PostgreSQL Schema (supabase/migrations/*.sql)
       │
       ▼
supabase gen types typescript --project-id <ref>
       │
       ▼
packages/schemas/src/generated/database.types.ts  (auto-generated, DO NOT EDIT)
       │
       ▼
packages/schemas/src/entities/*.ts  (hand-authored Zod schemas referencing generated types)
       │
       ▼
Exported as @eventology/schemas for consumption by both web and mobile
```

### 9.2 Example Entity Schema (Zod)

```tsx
// packages/schemas/src/entities/event.ts
import { z } from 'zod';
import type { Database } from '../generated/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];

export const eventSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  // ... validated fields matching EventRow
}) satisfies z.ZodType<EventRow>;

export const createEventSchema = eventSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  views_count: true,
  registrations_count: true,
});

export type Event = z.infer<typeof eventSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
```

---

## 10. API Architecture

Per ARCHITECTURAL_DNA.md §4.2 — Dual API Namespace.

### 10.1 Route Map

| Namespace | Auth | Method | Endpoint | Description |
| --- | --- | --- | --- | --- |
| **Public** | No | GET | `/api/public/events` | List events (paginated, filterable) |
| **Public** | No | GET | `/api/public/events/[slug]` | Get event by slug |
| **Public** | No | GET | `/api/public/categories` | List categories |
| **Public** | No | GET | `/api/public/events/featured` | Featured events |
| **Public** | No | GET | `/api/public/events/nearby` | Events near GPS coordinates |
| **Public** | No | GET | `/api/public/search` | Full-text search |
| **Protected** | Yes | POST | `/api/protected/events` | Create event (organizer) |
| **Protected** | Yes | PUT | `/api/protected/events/[id]` | Update event (organizer) |
| **Protected** | Yes | DELETE | `/api/protected/events/[id]` | Cancel event (organizer) |
| **Protected** | Yes | POST | `/api/protected/registrations` | Register for event |
| **Protected** | Yes | POST | `/api/protected/check-in` | Check in attendee (organizer) |
| **Protected** | Yes | GET | `/api/protected/my-tickets` | User’s tickets |
| **Protected** | Yes | GET | `/api/protected/my-events` | Organizer’s events |
| **Protected** | Yes | POST | `/api/protected/payments/init` | Initialize payment (Chapa) |
| **Protected** | Yes | GET | `/api/protected/analytics/[eventId]` | Event analytics (organizer) |
| **Protected** | Yes | POST | `/api/protected/messages` | Send message (organizer) |
| **Admin** | Admin | GET | `/api/protected/admin/moderation` | Moderation queue |
| **Admin** | Admin | POST | `/api/protected/admin/moderate` | Approve/reject event |
| **Admin** | Admin | GET | `/api/protected/admin/users` | User management |
| **Admin** | Admin | GET | `/api/protected/admin/analytics` | Platform analytics |
| **Admin** | Admin | GET | `/api/protected/admin/audit-log` | Audit log |
| **Webhooks** | Signature | POST | `/api/webhooks/chapa` | Chapa payment callback |
| **Webhooks** | Signature | POST | `/api/webhooks/telebirr` | Telebirr payment callback |

### 10.2 Response Format (Standardized)

```tsx
// Success
{ data: T, meta?: { page, limit, total, hasMore } }

// Error
{ error: { code: string, message: string, details?: unknown } }
```

---

## 11. Authentication & Authorization

### 11.1 Auth Flow

```
Sign Up → Supabase Auth (email/password or phone OTP)
       → auth.users row created
       → Database trigger creates profiles row with role='attendee'
       → Client receives JWT

Sign In → Supabase Auth
       → JWT with profile.role claim via custom JWT hook
       → Middleware reads role, enforces tier access
```

### 11.2 Role-Based Access Matrix

| Resource | Attendee | Organizer | Admin |
| --- | --- | --- | --- |
| Browse events | ✅ | ✅ | ✅ |
| Register for event | ✅ | ✅ | ✅ |
| View own tickets | ✅ | ✅ | ✅ |
| Create event | ❌ | ✅ | ✅ |
| Manage own events | ❌ | ✅ | ✅ |
| Scan QR / check-in | ❌ | ✅ (own events) | ✅ |
| View own analytics | ❌ | ✅ (own events) | ✅ |
| Moderate events | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View platform analytics | ❌ | ❌ | ✅ |
| Feature events | ❌ | ❌ | ✅ |
| Verify organizers | ❌ | ❌ | ✅ |

### 11.3 RLS Policies (Summary)

```sql
-- Events: Anyone can read approved events
CREATE POLICY "Public can view approved events" ON events
  FOR SELECT USING (status = 'approved');

-- Events: Organizers can CRUD their own events
CREATE POLICY "Organizers manage own events" ON events
  FOR ALL USING (organizer_id IN (
    SELECT id FROM organizers WHERE profile_id = auth.uid()
  ));

-- Registrations: Users can view/manage their own
CREATE POLICY "Users manage own registrations" ON registrations
  FOR ALL USING (profile_id = auth.uid());

-- Tickets: Users can view their own tickets
CREATE POLICY "Users view own tickets" ON tickets
  FOR SELECT USING (profile_id = auth.uid());

-- Admin: Full access with role check
CREATE POLICY "Admin full access" ON events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin')
  );
```

---

## 12. Resolved Decisions Log

> **All 8 open questions have been resolved by architect directive (May 25, 2026).**

| # | Question | Resolution |
| --- | --- | --- |
| Q1 | Supabase Project Region | **EU West (Ireland)** — closest to Ethiopia |
| Q2 | Payment Provider Priority | **Chapa-first** — Telebirr deferred to V2 |
| Q3 | SMS Gateway Selection | **Africa’s Talking** — pan-African coverage, best documentation, Ethiopian SMS routes. Afro Message as fallback. |
| Q4 | Email Provider | **Resend** — confirmed. React Email templates for branded transactional emails. |
| Q5 | AI Scope | **Full AI-native LLM-powered platform** — NOT lightweight. OpenRouter with 8-model free-tier fallback chain. AI chatbots, workflow agents, content generation, moderation, fraud detection, recommendations, analytics narration across ALL tiers. See Part 3 §5 for complete specification. |
| Q6 | Seat Maps | **DEFERRED TO V2** — General admission only for V1. Interactive SVG seat maps are V2 scope. |
| Q7 | Mobile App Publishing | **Expo internal distribution (EAS Build)** for demo and V1 testing → **Full App Store + Play Store listing** post-V1 completion. |
| Q8 | Production Domain | **https://eventology-nu.vercel.app/** — temporary production domain on Vercel until V2 when custom domain is acquired. |

### Additional Architect Directives (May 25, 2026)

| Directive | Detail |
| --- | --- |
| **Auth Framework** | **better-auth** replaces Supabase Auth. PostgreSQL-backed sessions, JWT tokens, Email/Password + Phone OTP. Integration with Supabase RLS via custom claims. |
| **AI Model Fallback Chain** | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` → `openai/gpt-oss-120b:free` → `poolside/laguna-xs.2:free` → `poolside/laguna-m.1:free` → `arcee-ai/trinity-large-thinking:free` → `nvidia/nemotron-3-nano-30b-a3b:free` → `nvidia/nemotron-nano-9b-v2:free` → `openai/gpt-oss-20b:free` |
| **All Recommended Features** | The 13 architect-recommended features (§1.3) are **firmly included** in V1 — not optional. |
| **Testing Priority** | **Priority 0** — Full codebase audit, unit tests, integration tests, and manual dev server verification required before any release. Seed data for all entities required for internal team audit. |
| **Mock Data Seeding** | Comprehensive seed data required: 50+ events, 10+ organizers, 200+ registrations, sample payments, reviews, audit log entries, promo codes. All CRUD operations must be testable against seed data. |
| **Gap Resolutions** | All 11 gaps identified in §2.2 are **approved for implementation** as specified. |

---

> **Next Document:** V1_MASTER_PART2_FEATURES.md — Complete feature specifications, UI screen mapping, and component architecture for all three tiers.

---

*Eventology V1 MVP — Master Architecture Document Part 1 of 5*

*© 2026 VersaLabs Studio. All rights reserved.*
