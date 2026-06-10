# Eventology V1 MVP — Cross-Agent Session Handover Protocol (Part 5 of 5)

> **Author:** Kidus Abdula — Lead SWE & Systems Architect
>
> **Version:** 1.0.0
>
> **Created:** May 25, 2026
>
> **Classification:** Master Source of Truth — Cross-Agent Session Handover
>
> **Status:** ✅ ARCHITECT APPROVED

<!-- RECOVERY NOTE (2026-06-10): Restored verbatim from Kidus's Notion backup after the
docs/ master set was discarded. This part was captured complete. -->

---

## Table of Contents

1. Handover Protocol Purpose
2. Document Registry
3. Agent Startup Message
4. Session Resumption Protocol
5. Agent Operating Constraints
6. Verification Checkpoints
7. Escalation Protocol
8. Glossary & Quick Reference

---

## 1. Handover Protocol Purpose

This document ensures any coding agent — regardless of model capability — can pick up the Eventology V1 project at any checkpoint and continue work without losing context, making incorrect assumptions, or introducing scope creep.

### 1.1 Rules for Every Agent Session

1. **Read before you code.** Before writing ANY code, read the relevant Part document for the feature you’re implementing.
2. **Schema is sacred.** Never modify database schema without architect approval. The schema in Part 1 §8 is the source of truth.
3. **Golden template first.** If you’re building a new module, reference the Events module pattern exactly.
4. **Build must pass.** Every session must end with `turbo run build` passing with zero errors.
5. **No hallucinated dependencies.** Only install packages listed in the architecture docs. If you need something new, flag it.
6. **AI is not optional.** Every feature that has an AI companion (per Part 2) must include the AI integration.
7. **Test what you build.** Write tests alongside implementation, not as an afterthought.

---

## 2. Document Registry

| Document | Path | Purpose | Read When |
| --- | --- | --- | --- |
| **ARCHITECTURAL_DNA.md** | `/ARCHITECTURAL_DNA.md` | Design philosophy, patterns, non-negotiables | Before ANY work |
| **BUSINESS_RESPONSE_V1.md** | `/BUSINESS_RESPONSE_V1.md` | Original scope, competitive analysis, user roles | For business context |
| **Part 1: Architecture** | `/docs/V1_MASTER_PART1_ARCHITECTURE.md` | Schema, infrastructure, monorepo, API design, auth | Before backend work |
| **Part 2: Features** | `/docs/V1_MASTER_PART2_FEATURES.md` | Feature specs, UI mapping, acceptance criteria, AI features | Before any feature |
| **Part 3: Integrations** | `/docs/V1_MASTER_PART3_INTEGRATIONS.md` | Chapa, SMS, email, push, AI/OpenRouter, i18n, maps, better-auth | Before integration work |
| **Part 4: Timeline** | `/docs/V1_MASTER_PART4_TIMELINE.md` | Day-by-day execution, milestones, testing matrix | For scheduling |
| **Part 5: Handover** | `/docs/V1_MASTER_PART5_HANDOVER.md` | THIS DOCUMENT — agent startup, resumption, constraints | At session start |

---

## 3. Agent Startup Message

> **Copy the message below EXACTLY as the initial prompt for the coding agent.**

---

### ⚡ EVENTOLOGY V1 MVP — AGENT STARTUP MESSAGE

```
You are the implementing coding agent for Eventology V1 MVP — a full-stack, AI-native,
LLM-powered national-scale event management platform for Ethiopia.

═══════════════════════════════════════════════════════════════
                    CRITICAL: READ BEFORE CODING
═══════════════════════════════════════════════════════════════

Before writing ANY code, you MUST read these documents in order:

1. /ARCHITECTURAL_DNA.md — Design philosophy and non-negotiable patterns
2. /docs/V1_MASTER_PART1_ARCHITECTURE.md — Schema, infrastructure, monorepo topology
3. /docs/V1_MASTER_PART2_FEATURES.md — Feature specifications and acceptance criteria
4. /docs/V1_MASTER_PART3_INTEGRATIONS.md — Payment, SMS, email, AI, auth integration specs
5. /docs/V1_MASTER_PART4_TIMELINE.md — Day-by-day execution plan
6. /docs/V1_MASTER_PART5_HANDOVER.md — Agent operating constraints and handover protocol

═══════════════════════════════════════════════════════════════
                    PROJECT OVERVIEW
═══════════════════════════════════════════════════════════════

WHAT:       Eventology — AI-native event management platform for Ethiopia
TECH STACK: Next.js 16 + Expo (React Native) + Supabase (PostgreSQL) +
            better-auth + OpenRouter AI + Turborepo monorepo
TIMELINE:   4 weeks (May 26 – June 22, 2026)
PRODUCTION: https://eventology-nu.vercel.app/ (Vercel)
REPO:       c:\Users\kidus\Documents\Projects\eventology

═══════════════════════════════════════════════════════════════
                    EXECUTION ORDER
═══════════════════════════════════════════════════════════════

PHASE 0 — PRE-IMPLEMENTATION (Day 0):
  Task 0.1: Create mvp-demo branch from current main (preserves the approved demo)
  Task 0.2: Build Expo demo app on mvp-demo branch for marketing team
            - Port 6 screens with mock data: Home, Discover, Search, Tickets, Event Detail, Profile
            - Deploy via EAS Build for internal distribution
            - This is a DEMO ONLY — mock data, no backend
  Task 0.3: Return to main branch, initialize Turborepo monorepo structure
  Task 0.4: Create Supabase project (EU West region)
  Task 0.5: Set up all environment variables

PHASE 1 — FOUNDATION (Week 1):
  Day 1: Author ALL 18 SQL migration files, apply to Supabase, generate types
  Day 2: Author 14 Zod entity schemas + shared packages (config, utils, locales, ai)
  Day 3: Set up better-auth (Email/Password + Phone OTP + role-based middleware)
  Day 4: Migrate 20 UI primitives from demo + create 15 new ones
  Day 5: AI package foundation (OpenRouter client + 18 service functions)

PHASE 2 — CORE FEATURES (Week 2):
  Day 6: Events module (GOLDEN TEMPLATE) — full CRUD + AI auto-tag + description gen
  Day 7: Registration & ticketing (select tier → register → QR ticket → waitlist)
  Day 8: Search (traditional + AI NLP) + categories + venue maps + "Events Near Me"
  Day 9: Mobile app core screens (5 tabs + event detail + auth)
  Day 10: Reviews/ratings + social sharing + calendar + event cloning + recurring events

PHASE 3 — PAYMENTS, AI & COMMS (Week 3):
  Day 11: Chapa payment integration (init → checkout → webhook → ticket)
  Day 12: Revenue dashboard + payouts + refunds + promo codes
  Day 13: Email (Resend) + SMS (Africa's Talking) + Push (Expo) + in-app notifications
  Day 14: ALL AI features deployed across all 3 tiers (chatbots, moderation, analytics, etc.)
  Day 15: Messaging + i18n (EN/AM) + mobile completion

PHASE 4 — POLISH & LAUNCH (Week 4):
  Day 16: Admin panel completion (moderation, verification, analytics, audit log)
  Day 17: Organizer dashboard completion (live check-in, QR scan, team mgmt, sponsors)
  Day 18: Mobile app completion (payments, QR scanner, offline tickets, GPS)
  Day 19: Comprehensive seed data + unit tests + integration tests
  Day 20: Full QA (cross-browser, responsive, performance, accessibility, error states)
  Day 21-22: Production deployment + smoke tests

═══════════════════════════════════════════════════════════════
                    NON-NEGOTIABLE RULES
═══════════════════════════════════════════════════════════════

1. SCHEMA FIRST: All 18 SQL migrations must be authored and applied BEFORE any
   application code. No exceptions. Copy schema exactly from Part 1 §8.

2. BETTER-AUTH NOT SUPABASE AUTH: Authentication uses better-auth with PostgreSQL
   adapter. Do NOT use @supabase/auth or Supabase Auth UI.

3. AI IS NOT OPTIONAL: This is an AI-NATIVE platform. Every feature with an AI
   companion (per Part 2) MUST include the AI integration. The OpenRouter fallback
   chain is:
   nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free →
   openai/gpt-oss-120b:free →
   poolside/laguna-xs.2:free →
   poolside/laguna-m.1:free →
   arcee-ai/trinity-large-thinking:free →
   nvidia/nemotron-3-nano-30b-a3b:free →
   nvidia/nemotron-nano-9b-v2:free →
   openai/gpt-oss-20b:free

4. GOLDEN TEMPLATE: Events module is built first. All subsequent modules MUST
   follow the same patterns (hooks, API routes, components, config).

5. THREE-TIER ARCHITECTURE:
   - (public)/*    → Tier 1: No auth required
   - (organizer)/* → Tier 2: Requires organizer or admin role
   - (admin)/*     → Tier 3: Requires admin role

6. DUAL API NAMESPACE:
   - /api/public/*    → Unauthenticated, read-only (GET only)
   - /api/protected/* → Authenticated, full CRUD
   - /api/webhooks/*  → External service callbacks (Chapa)

7. TESTING PRIORITY 0: Write tests alongside implementation. Seed data for all
   entities. Full CRUD testing against seed data. Build must pass at all times.

8. DESIGN CARRY-FORWARD: The approved demo's design system (light mode primary,
   glassmorphism, OKLCH colors, Framer Motion animations) carries forward.
   Do NOT redesign — upgrade.

9. SEAT MAPS DEFERRED: Interactive SVG seat maps are V2 scope. Do NOT implement.
   General admission only for V1.

10. CHAPA FIRST: Only Chapa for payments in V1. Telebirr is V2.

═══════════════════════════════════════════════════════════════
                    START HERE
═══════════════════════════════════════════════════════════════

Begin with PHASE 0 — Pre-Implementation Tasks:
1. Read all 5 master documents
2. Execute Task 0.1: Create mvp-demo branch
3. Execute Task 0.2: Build Expo demo for marketing team
4. Execute Task 0.3: Initialize Turborepo monorepo on main
5. Execute Task 0.4: Create Supabase project
6. Execute Task 0.5: Set up environment variables

Then proceed to PHASE 1 — Foundation (Week 1) as specified in Part 4.

Good luck. Build something extraordinary.
```

---

## 4. Session Resumption Protocol

When an agent session is interrupted or a new session begins mid-project, follow this protocol:

### Step 1: Identify Current Milestone

Check the milestone checklist in Part 4 §9. Determine which milestone was last completed.

### Step 2: Check Build Status

```bash
cd c:\Users\kidus\Documents\Projects\eventology
turbo run build
```

If the build fails, fix build errors before proceeding to new work.

### Step 3: Review Recent Changes

```bash
git log -n 20 --oneline
git diff --stat HEAD~5
```

### Step 4: Read Relevant Documentation

Based on the current milestone, re-read the Part document for the next phase of work.

### Step 5: Resume from Next Uncompleted Task

Continue from the exact point in Part 4’s day-by-day plan where work stopped.

---

## 5. Agent Operating Constraints

### 5.1 Dependency Installation Rules

**Approved dependencies (install freely):**
- Any package listed in Part 1 §5 (monorepo topology) or Part 3 (integrations)
- Radix UI primitives (@radix-ui/react-*)
- Supabase client libraries (@supabase/*)
- better-auth and its adapters
- Expo SDK packages (expo-*)
- TanStack Query (@tanstack/react-query)
- React Hook Form + Zod
- Framer Motion
- Lucide React
- Recharts
- Sonner
- Resend
- qrcode.react

**Requires architect approval:**
- Any ORM (Prisma, Drizzle) — We use Supabase client directly
- Any CSS framework change — We use Tailwind CSS 4.x
- Any state management library — We use TanStack Query + React hooks
- Any auth library other than better-auth
- Any payment provider other than Chapa

### 5.2 File Organization Rules

```
✅ CORRECT: components/public/events/event-card.tsx
❌ WRONG:   components/EventCard.tsx (no boundary isolation)

✅ CORRECT: app/api/public/events/route.ts
❌ WRONG:   app/api/events/route.ts (no namespace separation)

✅ CORRECT: packages/schemas/src/entities/event.ts
❌ WRONG:   apps/web/src/types/event.ts (types must be in shared package)
```

### 5.3 Code Style Rules

- TypeScript strict mode — no `any`, no type assertions without justification
- All components are function components with explicit return types
- All API responses follow the standard format: `{ data, meta? }` or `{ error: { code, message } }`
- Use `cn()` utility for conditional class merging
- Server Components by default; `"use client"` only when needed
- Barrel exports from package `index.ts` files

### 5.4 Commit Message Format

```
feat(events): Add event creation wizard with AI description generator
fix(auth): Resolve better-auth session refresh on mobile
docs(schema): Add migration 018 for AI cache tables
test(registration): Add integration tests for waitlist auto-promotion
chore(deps): Upgrade Expo SDK to 52.1
```

---

## 6. Verification Checkpoints

At each milestone, the implementing agent must verify:

### Checkpoint Template

```
MILESTONE: [Name]
DATE: [Date]

BUILD STATUS:
  $ turbo run build → [PASS/FAIL]
  $ turbo run lint → [PASS/FAIL]
  $ turbo run test → [X/Y tests passing]

FUNCTIONALITY VERIFIED:
  - [ ] Feature A working end-to-end
  - [ ] Feature B working end-to-end
  - [ ] No console errors in browser
  - [ ] No TypeScript errors
  - [ ] Responsive at 375px, 768px, 1440px

DEPLOYMENT VERIFIED:
  - [ ] Vercel preview deployment successful
  - [ ] No environment variable missing

NOTES:
  [Any issues, workarounds, or deferred items]
```

---

## 7. Escalation Protocol

### When to Escalate to Architect

| Situation | Action |
| --- | --- |
| Schema change needed | STOP. Document the proposed change and why. Do not apply. |
| New dependency required (not in approved list) | Flag it with justification. Proceed only if non-critical path. |
| Better-auth + Supabase RLS integration issue | Document the specific failure. Test RLS independently. |
| OpenRouter all models failing | Implement graceful degradation. Disable AI features, show “AI unavailable” state. |
| Chapa API undocumented behavior | Log exact request/response. Test in Chapa sandbox. |
| Scope question (“Should feature X include Y?”) | Check Part 2 acceptance criteria. If not listed, it’s out of scope. |
| Build failure that can’t be resolved | Share the exact error. Do not delete code to make it build. |

### When to Continue Without Escalation

| Situation | Action |
| --- | --- |
| Minor UI adjustments | Proceed. Match approved demo aesthetic. |
| Import path changes after monorepo restructure | Fix and continue. |
| TypeScript type refinements | Proceed if types remain compatible with schema. |
| Adding indexes for query performance | Proceed. Document in migration file. |
| Fixing linting errors | Fix and continue. |

---

## 8. Glossary & Quick Reference

### Tech Stack Quick Reference

| What | Technology | Package |
| --- | --- | --- |
| Web Framework | Next.js 16 (App Router) | `next` |
| Mobile Framework | Expo (React Native) | `expo` |
| Database | PostgreSQL 15+ | Supabase managed |
| Auth | better-auth | `better-auth` |
| Payments | Chapa | REST API (no SDK) |
| Email | Resend | `resend` |
| SMS | Africa’s Talking | REST API |
| AI | OpenRouter | REST API (OpenAI-compatible) |
| Push | Expo Push | `expo-notifications` |
| Styling | Tailwind CSS 4.x | `tailwindcss` |
| State | TanStack Query | `@tanstack/react-query` |
| Forms | React Hook Form + Zod | `react-hook-form`, `zod` |
| UI Primitives | Radix UI | `@radix-ui/react-*` |
| Animations | Framer Motion | `framer-motion` |
| Icons | Lucide React | `lucide-react` |
| Charts | Recharts | `recharts` |
| Maps (Web) | Leaflet | `react-leaflet` |
| Maps (Mobile) | Google/Apple Maps | `react-native-maps` |
| Monorepo | Turborepo | `turbo` |
| i18n (Web) | next-intl | `next-intl` |
| i18n (Mobile) | expo-localization | `expo-localization` |
| QR Codes | qrcode.react | `qrcode.react` |

### Environment Variables Quick Reference

| Variable | Service | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | ✅ |
| `SUPABASE_DB_URL` | Supabase | ✅ |
| `BETTER_AUTH_SECRET` | better-auth | ✅ |
| `BETTER_AUTH_URL` | better-auth | ✅ |
| `CHAPA_SECRET_KEY` | Chapa | ✅ |
| `CHAPA_WEBHOOK_SECRET` | Chapa | ✅ |
| `RESEND_API_KEY` | Resend | ✅ |
| `AT_API_KEY` | Africa’s Talking | ✅ |
| `AT_USERNAME` | Africa’s Talking | ✅ |
| `OPENROUTER_API_KEY` | OpenRouter | ✅ |
| `EXPO_ACCESS_TOKEN` | Expo Push | ✅ |
| `NEXT_PUBLIC_APP_URL` | App | ✅ |

### Database Tables Quick Reference

| Table | Bounded Context | Key Relationships |
| --- | --- | --- |
| `profiles` | Identity | → auth.users |
| `organizers` | Identity | → profiles |
| `organizer_team_members` | Identity | → organizers, profiles |
| `categories` | Discovery | Referenced by events |
| `venues` | Discovery | Referenced by events |
| `events` | Discovery | → organizers, categories, venues |
| `ticket_tiers` | Ticketing | → events |
| `registrations` | Ticketing | → events, profiles, ticket_tiers |
| `tickets` | Ticketing | → registrations, events, profiles |
| `payments` | Payments | → registrations, events, profiles |
| `payouts` | Payments | → organizers |
| `conversations` | Communication | → events, organizers |
| `messages` | Communication | → conversations, profiles |
| `reviews` | Moderation | → events, profiles |
| `sponsors` | Sponsors | → events |
| `notifications` | Communication | → profiles |
| `event_views` | Analytics | → events, profiles |
| `audit_log` | Moderation | → profiles |
| `promo_codes` | Ticketing | → events |
| `ai_cache` | AI | Standalone cache |

### OpenRouter Model Fallback Chain

```
Priority 1: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free
Priority 2: openai/gpt-oss-120b:free
Priority 3: poolside/laguna-xs.2:free
Priority 4: poolside/laguna-m.1:free
Priority 5: arcee-ai/trinity-large-thinking:free
Priority 6: nvidia/nemotron-3-nano-30b-a3b:free
Priority 7: nvidia/nemotron-nano-9b-v2:free
Priority 8: openai/gpt-oss-20b:free
```

---

> **This concludes the 5-part Eventology V1 MVP Master Documentation.**
>
> All documents should be read in order (Part 1 → 5) before any implementation begins.
> The agent startup message in §3 contains everything needed to bootstrap a new coding session.

---

*Eventology V1 MVP — Cross-Agent Session Handover Protocol Part 5 of 5*

*© 2026 VersaLabs Studio. All rights reserved.*
