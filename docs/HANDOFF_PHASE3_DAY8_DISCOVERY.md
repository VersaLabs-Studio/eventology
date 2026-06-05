# Handoff → OpenCode Mesh — Phase 3 / Day 8: Search + Categories + Venue Maps

> Next module per the master roadmap (`IMPLEMENTATION_PHASE2.md`, Day 8).
> Day 7 (Registration & Ticketing) is **merged and auditor-approved** (commit
> `6d0cb5f`). Same discipline: clone the realized vertical — schema → factory
> hooks → API routes → premium UI. Mark `STATUS:` as you go; kimi review →
> auditor re-score → merge.

---

## READ FIRST — the template is the merged code

The canonical pattern is the merged Events/Registrations modules — **not** the
stale snippets in `IMPLEMENTATION_PHASE2.md`. Day 8 is mostly **public, read-only
discovery**, so it leans on the *public* path, but the same rules hold.

| Layer | Copy from (canonical) |
|-------|------------------------|
| Factory hooks | `apps/web/src/hooks/factory/*`, `use-events.ts` |
| API factory handlers | `apps/web/src/lib/api/{list,doc}-handler.ts` |
| Public routes | `apps/web/src/app/api/public/{events,categories,venues}/**` (already exist) |
| Entity config / keys | `packages/config/src/{entity-config,query-keys}.ts`, `query-key-map.ts` |
| Auth (only where protected) | `lib/supabase/jwt.ts` + `createAuthedClient` |

**Non-negotiable rules carried forward:**
1. **Public reads use the anon `createClient()`**; any protected/admin write uses
   `createAuthedClient(session.user.id)`. RLS (`016`) is the authz source.
2. **Search input is untrusted.** The PostgREST `.or()` escaping fix from Day 6
   (FIX-004 — strip/encode `,` `(` `)` `*`) already lives in the public events
   route and `list-handler`. **Reuse that sanitizer — do not reintroduce raw
   interpolation.** Factor it into one shared helper if it isn't already.
3. **Standard envelopes** `{ data, meta }` / `{ error: { code, message } }`. No `any`.
4. **Don't regress Day 7** — migrations `019–023`, the JWT bridge, server-controlled
   field stripping all stay intact.

---

## TASK-D8-001 — Search & filtering  **[do first]**

**STATUS:** OPEN

The public events route already supports `search`, `category`, pagination. Extend
it into a real discovery surface.

### API (`apps/web/src/app/api/public/events/route.ts`)
- Add filters: `date` range (`from`/`to`), `price` (free / paid / range),
  `venue`/`city`, `sort` (date, popularity via `registrations_count`, price).
- Keep the **sanitized** `.or()` text search over `title`/`description`. Consider
  a Postgres `tsvector` GIN index for relevance if cheap — otherwise `ilike` is
  acceptable for MVP. If you add an index, do it in a **new migration** (`024+`).
- Return the standard list envelope with accurate `meta.total` for the filter set.

### Hook — `apps/web/src/hooks/use-events.ts`
- Extend `useEvents(options)` (or add `useEventSearch`) to pass the new filters
  through `ListOptions`. Debounce the text term in the UI, not the hook.

### UI — `(public)/events/page.tsx` (search/browse)
- Filter bar (category chips, date, price, sort), debounced search box, results
  grid using the premium event card, empty + loading states, URL-synced query
  params (shareable searches).

### Acceptance
- Searching `"jazz, (night)"` does not break the query (escaping holds).
- Category + date + price filters compose; `meta.total` reflects the filtered set.
- Filter state survives refresh (URL params).

---

## TASK-D8-002 — Categories browse  **[depends on D8-001 hooks]**

**STATUS:** OPEN
**Schema:** `categories` (RLS: public read). Route `api/public/categories` exists.

- `useCategories()` via the factory (`useList('categories')`) — add `categories`
  to `ENTITY_CONFIG`/`QUERY_KEY_MAP` if not already present (it is in the map).
- `(public)/categories/page.tsx` — category index (icon/name/count).
- `(public)/categories/[slug]/page.tsx` — events in a category, reusing the
  D8-001 filtered events query with `category` pre-applied. Use the
  `categories!inner` join hint (the Day-6 FIX-004 fix) so category filtering
  actually filters top-level rows.

### Acceptance
- Category index lists all active categories with correct event counts.
- A category page shows only that category's approved events, paginated.

---

## TASK-D8-003 — Venue maps  **[react-leaflet]**

**STATUS:** OPEN
**Schema:** `venues` (lat/lng, address). Route `api/public/venues` exists.
**Deps:** `react-leaflet`, `leaflet` (Phase 2 deps — install if missing).

- **SSR caveat:** Leaflet touches `window`. Import the map component with
  `next/dynamic` `{ ssr: false }`; never render it server-side. Include leaflet's
  CSS once (layout or the map component).
- `useVenue(id)` / `useVenues()` via the factory.
- `(public)/venues/[id]/page.tsx` — venue detail: map with a marker at
  lat/lng, address, and the list of upcoming approved events at that venue
  (reuse the events query filtered by venue).
- On the event detail page (`(public)/events/[slug]`), add a small venue map
  section using the same dynamic map component.
- Guard missing coordinates (no lat/lng → show address only, no broken map).

### Acceptance
- Venue page renders a map centered on the venue with a marker; no SSR/`window`
  error.
- A venue with null coordinates degrades gracefully (address-only).
- Events-at-venue list shows only that venue's approved events.

---

## TASK-D8-004 — Premium UI pass (P4)

**STATUS:** OPEN
**Spec:** `EXECUTION_BLUEPRINT.md` design rules (semantic tokens only,
Outfit/Inter, card/button patterns, Framer Motion easing `[0.25,0.1,0.25,1]`,
44px touch targets, glassmorphism), `BLUEPRINT_PAGES_PUBLIC.md`.

- All new pages wired to real hooks (no mock data), responsive, with loading
  skeletons and empty states.
- Passes a **`ui-auditor`** pass before merge.

### Acceptance
- Discovery is demoable end-to-end: search → filter → category → venue map →
  event → register (the Day-7 flow). `ui-auditor` clean.

---

## GUARDRAILS
P1 Schema-First · P2 Factory · P3 Modularization · P4 Premium UI · P5 Docs · P6 Type-safety.

- Reuse the merged factory/handlers and the **shared search sanitizer** — no raw
  `.or()` interpolation.
- Public reads via anon client; RLS is authz truth; don't regress Day 7
  (migrations `019–023`, JWT bridge, field stripping).
- Leaflet is client-only (`next/dynamic`, `ssr:false`); guard null coordinates.
- New migrations only (`024+`); don't edit applied migrations in place.
- **Verify at runtime, not just `tsc`** — `.rpc()`/`.from()` are stringly-typed;
  a green type-check can't see a missing column, function, or SSR crash. Report
  observed behavior.
- After build: kimi review → Opus auditor re-score → merge. Next in queue after
  this: Day 9 (Mobile real data), then Day 10 (Reviews/Social/Calendar).
