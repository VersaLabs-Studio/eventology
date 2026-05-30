# Eventology — Phase 1 Implementation Reference

> **Branch:** `main`
> **Status:** ✅ Complete (audit fixes applied)
> **Purpose:** Foundation layer — schema, types, schemas, auth, AI, shared packages

---

## What Was Built

### Phase 0 — Monorepo Restructure
```
eventology/
├── apps/web/          ← Next.js 16 (moved from root)
├── apps/mobile/       ← Placeholder (Expo built on mvp-demo)
├── packages/
│   ├── schemas/       ← @eventology/schemas (Zod + types)
│   ├── config/        ← @eventology/config (entity config, query keys)
│   ├── utils/         ← @eventology/utils (format, validators, geo)
│   ├── locales/       ← @eventology/locales (EN/AM)
│   └── ai/            ← @eventology/ai (OpenRouter + 18 services)
├── supabase/
│   └── migrations/    ← 18 SQL migration files
├── turbo.json
├── package.json       ← Workspace root
├── tsconfig.base.json
├── .env.local
└── docs/              ← All master documentation
```

### Phase 1A — Database Schema (18 Migrations)

| Migration | Tables | Key Features |
|-----------|--------|--------------|
| `001_extensions.sql` | — | uuid-ossp, pgcrypto, postgis, pg_trgm |
| `002_enums.sql` | — | 20 enum types |
| `003_users_profiles.sql` | `profiles` | Auth sync, role-based, GPS location |
| `004_organizers.sql` | `organizers`, `organizer_team_members` | Multi-tenant, verification, commission |
| `005_categories_venues.sql` | `categories`, `venues` | PostGIS geometry, Amharic names |
| `006_events.sql` | `events` | Full-text search, GIS, tags, recurrence |
| `007_tickets_registrations.sql` | `ticket_tiers`, `registrations`, `tickets` | QR data, waitlist, auto-count triggers |
| `008_payments.sql` | `payments`, `payouts` | Chapa integration, commission calculation |
| `009_messaging.sql` | `conversations`, `messages` | Real-time messaging |
| `010_reviews_ratings.sql` | `reviews` | Moderation support |
| `011_sponsors.sql` | `sponsors` | Tier-based (platinum/gold/silver/bronze) |
| `012_notifications.sql` | `notifications` | Multi-channel (email/sms/push/in-app) |
| `013_analytics.sql` | `event_views` | View tracking with auto-count trigger |
| `014_audit_log.sql` | `audit_log` | Immutable audit trail |
| `015_promo_codes.sql` | `promo_codes` | Percentage/fixed, usage limits, expiry |
| `016_rls_policies.sql` | ALL 19 tables | RLS enabled everywhere, helper functions |
| `017_seed_data.sql` | — | 55 events, 12 venues, 200+ registrations |
| `018_ai_cache.sql` | `ai_cache` | AI response caching with TTL |

### Phase 1B — Zod Schemas + Shared Packages

**`@eventology/schemas`** (15 entity schemas):
- `profile.ts`, `organizer.ts`, `category.ts`, `venue.ts`, `event.ts`
- `ticket-tier.ts`, `registration.ts`, `ticket.ts`, `payment.ts`, `payout.ts`
- `review.ts`, `sponsor.ts`, `notification.ts`, `promo-code.ts`, `audit-log.ts`
- Each has: base schema, create schema, update schema, inferred types
- `generated/database.types.ts` — Row types matching SQL (to be replaced by `supabase gen types`)
- `enums.ts` — Runtime enum constants

**`@eventology/config`**:
- `entity-config.ts` — 18 entities with table, label, search fields, API paths
- `query-keys.ts` — 18 query key factories (`all()`, `list()`, `doc()`)
- `constants.ts` — Commission rate, pagination, upload limits, cache durations

**`@eventology/utils`**:
- `format.ts` — `formatETB`, `formatDate`, `formatRelativeTime`, `formatPhoneNumber`, `slugify`
- `validators.ts` — `isValidEthiopianPhone`, `isValidEmail`, `isValidUUID`, `isStrongPassword`
- `geo.ts` — `calculateDistance` (Haversine), `formatDistance`, `isWithinRadius`
- `cn.ts` — `cn()` (clsx + tailwind-merge)

**`@eventology/locales`**:
- `en.json` — English translations (~200 keys)
- `am.json` — Amharic translations (~200 keys)
- `getTranslations(locale)` helper

### Phase 1C — Authentication + Supabase Client

**better-auth** (NOT Supabase Auth):
- `apps/web/src/lib/auth.ts` — Server config with PostgreSQL adapter
- `apps/web/src/lib/auth-client.ts` — React client with `signIn`, `signUp`, `signOut`, `useSession`
- `apps/web/src/middleware.ts` — Role-based route protection:
  - `(public)/*` — No auth
  - `(organizer)/*` — Requires organizer or admin
  - `(admin)/*` — Requires admin
  - `/api/protected/*` — Any authenticated user
- `apps/web/src/hooks/use-auth.ts` — `useAuth()` hook with login/register/logout
- Auth pages: `/auth/login`, `/auth/signup` with Premium UI

**Supabase Client**:
- `apps/web/src/lib/supabase/server.ts` — Server client + service role client
- `apps/web/src/lib/supabase/client.ts` — Browser client

### Phase 1D — AI Package (`@eventology/ai`)

**OpenRouter Client** with 8-model fallback chain:
```
nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free →
openai/gpt-oss-120b:free → poolside/laguna-xs.2:free →
poolside/laguna-m.1:free → arcee-ai/trinity-large-thinking:free →
nvidia/nemotron-3-nano-30b-a3b:free → nvidia/nemotron-nano-9b-v2:free →
openai/gpt-oss-20b:free
```

**18 AI Service Functions**:

| # | Function | Tier | Cache |
|---|----------|------|-------|
| 1 | `generateEventDescription` | medium | 24h |
| 2 | `generateEventSummary` | light | 24h |
| 3 | `generateEventTags` | light | 24h |
| 4 | `generateMarketingCopy` | medium | 4h |
| 5 | `generatePricingSuggestion` | heavy | 1h |
| 6 | `generateAnalyticsNarrative` | heavy | 1h |
| 7 | `generateAttendeeInsights` | heavy | 1h |
| 8 | `generatePerformancePrediction` | heavy | 1h |
| 9 | `moderateContent` | heavy | none |
| 10 | `detectFraud` | heavy | none |
| 11 | `translateContent` | light | 7d |
| 12 | `chatbotResponse` | medium | none |
| 13 | `generateReport` | heavy | 1h |
| 14 | `recommendEvents` | medium | 1h |
| 15 | `searchWithNLP` | light | none |
| 16 | `generatePlatformHealthSummary` | heavy | 1h |
| 17 | `analyzeAuditLog` | heavy | none |
| 18 | `generateEventRecap` | medium | 24h |

---

## Path Aliases (Web App)

```json
{
  "@/*": "./src/*",
  "@eventology/schemas": "../../packages/schemas/src",
  "@eventology/config": "../../packages/config/src",
  "@eventology/utils": "../../packages/utils/src",
  "@eventology/locales": "../../packages/locales/src",
  "@eventology/ai": "../../packages/ai/src"
}
```

---

## Audit Results (Post-Fix)

| Area | Score | Status |
|------|-------|--------|
| SQL Migrations | 9/10 | ✅ Exemplary |
| Zod Schemas | 8/10 | ✅ Outstanding |
| AI Package | 9/10 | ✅ Golden template quality |
| Shared Packages | 7/10 | ✅ Ready for consumption |
| Authentication | 7/10 | ✅ better-auth configured |
| Path Aliases | ✅ | ✅ All `@eventology/*` paths configured |
| Middleware | ✅ | ✅ Fixed — attendees can access `/api/protected/*` |

### Remaining Items (Phase 2)
- Factory hooks (`useList`, `useDoc`, `useCreate`, `useUpdate`, `useDelete`)
- API routes (`/api/public/*`, `/api/protected/*`)
- Events golden template module
- Replace handwritten types with `supabase gen types` (once DB is connected)

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://dgpccoegetxwkabcujje.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # ← User inserts
SUPABASE_SERVICE_ROLE_KEY=            # ← User inserts
SUPABASE_DB_URL=                      # ← User inserts
BETTER_AUTH_SECRET=                   # ← Generate: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
OPENROUTER_API_KEY=                   # ← From OpenRouter dashboard
```

---

*© 2026 VersaLabs Studio. All rights reserved.*
