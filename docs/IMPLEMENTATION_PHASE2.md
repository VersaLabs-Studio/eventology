# Eventology — Phase 2 Implementation Reference

> **Branch:** `main`
> **Status:** 📋 Ready to Execute
> **Purpose:** Core features — Events golden template, registrations, search, reviews, mobile
> **Prerequisite:** Phase 1 complete, Supabase credentials in `.env.local`

---

## Execution Order

```
Day 6:  Events Module (GOLDEN TEMPLATE) — full CRUD + AI
Day 7:  Registration & Ticketing
Day 8:  Search + Categories + Venue Maps
Day 9:  Mobile App Core Screens (real data)
Day 10: Reviews/Ratings + Social Sharing + Calendar
```

---

## Day 6: Events Module — Golden Template

**This is the most important day.** Every subsequent module copies this pattern.

### Step 1: Factory Hooks (Generic)

Create `apps/web/src/hooks/factory/` with generic hooks that consume `@eventology/config`:

```typescript
// use-list.ts — Generic list hook with filters + pagination
// use-doc.ts — Generic single document hook
// use-create.ts — Generic create mutation
// use-update.ts — Generic update mutation  
// use-delete.ts — Generic delete mutation
```

Each hook uses:
- `ENTITY_CONFIG[entity]` for table name, search fields, API paths
- `QueryKeys[entity]` for cache key management
- TanStack Query for server state

### Step 2: API Route Factory (Generic)

Create `apps/web/src/lib/api/` with factory handlers:

```typescript
// create-list-handler.ts — GET list with pagination, search, filters
// create-get-handler.ts — GET single document
// create-create-handler.ts — POST with Zod validation
// create-update-handler.ts — PUT with Zod validation
// create-delete-handler.ts — DELETE (soft delete)
```

Each handler:
1. Validates auth via better-auth session
2. Validates body with Zod schema
3. Executes query via Supabase service role client
4. Returns standardized `{ data, meta? }` or `{ error: { code, message } }`

### Step 3: Events API Routes

```
apps/web/src/app/api/
├── public/
│   └── events/
│       ├── route.ts          # GET /api/public/events (list, filter, paginate)
│       └── [slug]/
│           └── route.ts      # GET /api/public/events/[slug]
├── protected/
│   └── events/
│       ├── route.ts          # POST /api/protected/events (create)
│       └── [id]/
│           ├── route.ts      # PUT, DELETE /api/protected/events/[id]
│           └── registrations/
│               └── route.ts  # GET event registrations
```

### Step 4: Events Factory Hooks

```typescript
// apps/web/src/hooks/use-events.ts
export function useEvents(options?) { /* list hook */ }
export function useEvent(id: string) { /* doc hook */ }
export function useEventBySlug(slug: string) { /* doc by slug */ }
export function useCreateEvent() { /* create mutation */ }
export function useUpdateEvent() { /* update mutation */ }
export function useDeleteEvent() { /* delete mutation */ }
```

### Step 5: Replace Mock Data in Existing Pages

Update all event-related pages to use factory hooks instead of mock imports:
- `(public)/page.tsx` — Homepage with featured events
- `(public)/events/page.tsx` — Event listing
- `(public)/events/[slug]/page.tsx` — Event detail
- `(organizer)/org/events/page.tsx` — Organizer event list
- `(organizer)/org/events/create/page.tsx` — Event creation wizard

### Step 6: AI Integration (Same Day)

- AI auto-tag suggestions on event creation
- AI event description generator (from bullet points)
- AI event summary for public display
- Uses `@eventology/ai` services

---

## Day 7: Registration & Ticketing

### API Routes
```
api/protected/registrations/route.ts     # POST — create registration
api/protected/registrations/[id]/route.ts # GET, PUT — manage registration
api/protected/tickets/route.ts           # GET — user's tickets
api/protected/tickets/[id]/route.ts      # GET — single ticket
api/protected/check-in/route.ts          # POST — QR check-in
```

### Hooks
```typescript
useRegistrations(eventId?)  // List registrations
useRegistration(id)         // Single registration
useCreateRegistration()     // Register for event
useMyTickets(tab?)          // User's tickets
useCheckIn()                // QR check-in mutation
```

### Pages to Update
- `(public)/register/[eventId]/page.tsx` — Registration flow
- `(public)/ticket/[ticketId]/page.tsx` — Digital ticket with QR
- `(public)/my-events/page.tsx` — My events/tickets
- `(organizer)/org/events/[eventId]/registrations/page.tsx` — Registration management
- `(organizer)/org/events/[eventId]/check-in/page.tsx` — QR check-in

### QR Code Generation
- Payload: `EVT-{ticketId}-{registrationId}-{hmac_signature}`
- Uses `qrcode.react` for display
- HMAC signed to prevent forgery

---

## Day 8: Search + Categories + Venue Maps

### API Routes
```
api/public/search/route.ts          # GET — full-text search
api/public/categories/route.ts      # GET — categories with counts
api/public/events/nearby/route.ts   # GET — PostGIS proximity search
api/public/events/featured/route.ts # GET — featured events
```

### Features
- Traditional search: keyword, category, date, location, price filters
- AI NLP search: "tech events this weekend in Bole" → structured filters
- Category grid with event counts
- Leaflet map on event detail page
- "Events Near Me" with PostGIS `ST_DWithin`

### Pages to Update
- `(public)/search/page.tsx` — Search with filters
- `(public)/page.tsx` — Category grid, nearby events

---

## Day 9: Mobile App — Real Data

### Tasks
1. Create Supabase client for mobile (`apps/mobile/lib/supabase.ts`)
2. Replace mock data with real Supabase queries
3. Add auth screens (login/signup)
4. Add push notification token registration
5. Update Home, Discover, Search, Tickets, Profile screens

---

## Day 10: Reviews, Ratings & Social

### API Routes
```
api/protected/reviews/route.ts              # POST — submit review
api/public/events/[slug]/reviews/route.ts   # GET — paginated reviews
api/protected/calendar/route.ts             # GET — ICS file generation
```

### Features
- Star rating (1-5) + text review
- Review moderation (admin approval)
- Social sharing with dynamic OG images
- Calendar integration (ICS + Google Calendar deep links)

---

## Module Pattern (Golden Template)

Every module follows this exact structure:

```
apps/web/src/
├── app/api/public/[entity]/route.ts      # Public GET endpoints
├── app/api/protected/[entity]/route.ts   # Protected CRUD endpoints
├── hooks/use-[entity].ts                 # Factory hooks
├── app/(public)/[entity]/page.tsx        # Public pages
├── app/(organizer)/org/[entity]/page.tsx # Organizer pages
└── components/[tier]/[entity]-*.tsx      # Domain components
```

### Hook Pattern
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EntityKeys } from '@eventology/config';
import { ENTITY_CONFIG } from '@eventology/config';
import type { Entity, CreateEntityInput } from '@eventology/schemas';

const config = ENTITY_CONFIG.entity_name;

export function useEntities(opts?) {
  return useQuery({
    queryKey: EntityKeys.list(opts),
    queryFn: async () => {
      const params = new URLSearchParams();
      // ... set params from opts
      const res = await fetch(`${config.protectedPath}?${params}`);
      return res.json();
    },
  });
}
```

### API Route Pattern
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { createEntitySchema } from '@eventology/schemas';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('table').select('*');
  
  if (error) return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}
```

---

## Verification Checklist (Phase 2 Exit Criteria)

- [ ] Events CRUD working end-to-end (create → list → detail → edit → cancel)
- [ ] Registration flow complete (select tier → register → QR ticket)
- [ ] Search working (traditional + AI natural language)
- [ ] Categories and venue map displayed
- [ ] Mobile app has 5 core screens with real data
- [ ] Reviews and ratings system working
- [ ] Social sharing with OG images
- [ ] Calendar integration working
- [ ] All factory hooks follow the golden template pattern
- [ ] All API routes use Zod validation
- [ ] `npm run build` passes with zero errors
- [ ] No `any` types in new code

---

## Dependencies to Install (Phase 2)

```bash
# In apps/web/
npm install @tanstack/react-query react-hook-form @hookform/resolvers zod
npm install react-leaflet leaflet  # For venue maps
npm install ics                     # For ICS file generation
npm install nanoid                  # For unique transaction references
```

---

*© 2026 VersaLabs Studio. All rights reserved.*
