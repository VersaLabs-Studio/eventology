# Handoff → OpenCode Mesh — Phase 3 / Day 10: Reviews + Social Sharing + Calendar

> Per the master roadmap (`IMPLEMENTATION_PHASE2.md:177-190`). **This completes
> Phase 2 (Days 6–10) on web.** Day 8 (Search/Categories/Venue Maps) is merged
> and auditor-approved (`phase3-day8`). Same discipline: schema → factory hooks →
> API routes → premium UI. Mark `STATUS:` as you go; kimi review → auditor → merge.
>
> **Note on sequencing:** "Day 9 — Mobile real data" is **deferred**. The Expo
> app lives on the untouched `mvp-demo` branch; there is no mobile source on
> `main`. Do **not** touch `mvp-demo`. We jump to Day 10 (web) per Kidus.

---

## READ FIRST — the template is the merged code

Canonical pattern = the merged Events/Registrations/Discovery modules, **not** the
stale snippets in `IMPLEMENTATION_PHASE2.md`.

| Layer | Copy from (canonical) |
|-------|------------------------|
| Factory hooks | `apps/web/src/hooks/factory/*`, `use-events.ts`, `use-registrations.ts` |
| API factory handlers | `apps/web/src/lib/api/{list,doc,create,update}-handler.ts` |
| Bespoke protected handler shape | `apps/web/src/app/api/protected/registrations/route.ts` |
| Auth bridge | `apps/web/src/lib/supabase/jwt.ts` + `createAuthedClient` |
| Public read route | `apps/web/src/app/api/public/events/route.ts` |

**Non-negotiable rules carried forward:**
1. Protected reads/writes use `createAuthedClient(session.user.id)`. RLS (`016`)
   is the authz source. Public reads use anon `createClient()`.
2. **Force server-controlled fields.** Inject `user_id` from session; the client
   never sets ownership or moderation state.
3. Zod-validate every body; standard `{ data, meta }` / `{ error: {code,message} }`
   envelopes; no `any`.
4. Don't regress Days 6–8 (migrations `019–023`, JWT bridge, field stripping).
5. **Verify at runtime, not just `tsc`** — `.from()`/`.rpc()` are stringly-typed;
   a green type-check can't see a missing column, an unset moderation flag, or a
   bad ICS payload. Report observed behavior.

---

## TASK-D10-001 — Reviews & Ratings  **[do first]**

**STATUS:** OPEN
**Schema (exists — `010`):** `reviews(event_id, user_id, rating 1–5, title, content,
is_approved DEFAULT false, is_flagged, flag_reason, moderated_by, moderated_at)`,
`UNIQUE(event_id, user_id)`.
**RLS (exists — `016:445-468`):** public read **approved only**; own read;
authenticated create (`auth.uid() = user_id`); own update; admin full.

### Routes
```
api/protected/reviews/route.ts                 # POST — submit a review
api/protected/reviews/[id]/route.ts            # PUT — edit own review
api/public/events/[slug]/reviews/route.ts      # GET — paginated approved reviews + aggregate
api/protected/admin/reviews/route.ts           # GET list + PATCH approve/flag (admin)
```

### Hooks — `apps/web/src/hooks/use-reviews.ts`
`useEventReviews(slug, opts)` (public list + aggregate), `useCreateReview()`,
`useUpdateReview()`, `useModerateReview()` (admin). Add `reviews` to
`ENTITY_CONFIG`/`QUERY_KEY_MAP`.

### Server-side logic (bespoke create handler — invariants, not a plain insert)
1. **Inject `user_id = session.user.id`** via `createAuthedClient`.
2. **Force moderation state:** `is_approved = false` on create; **strip**
   `is_approved`, `is_flagged`, `flag_reason`, `moderated_by`, `moderated_at` from
   client input. ⚠️ **These are NOT yet in `SERVER_CONTROLLED_FIELDS`
   (`create-handler.ts` / `update-handler.ts`) — add them**, or a user can
   self-publish/unflag their own review. This is a required handler change.
3. **Attendance gate (business rule RLS can't express):** only allow a review if
   the caller has a non-cancelled registration (ideally a `used` ticket, or the
   event has ended) for that event. Reject otherwise (`403 NOT_ATTENDED`).
4. **One-per-event:** the `UNIQUE(event_id, user_id)` will raise `23505` on a
   duplicate — map to `409 ALREADY_REVIEWED`.

### Aggregate (no schema change)
The public GET returns the paginated approved reviews **plus** an aggregate
`{ average: number, count: number, distribution: {1..5} }` computed over
**approved** reviews (a second count/avg query, or a small read-only RPC/`view`).
Do **not** denormalize a rating column onto `events` unless you add a maintained
trigger in a new migration — computed-on-read is fine for MVP.

### Moderation
Reuse the existing admin surface (`(admin)/admin/moderation/page.tsx`). Admin
PATCH sets `is_approved`/`is_flagged` via the admin RLS path (`createAuthedClient`
for an admin session; RLS `Reviews: admin full access`).

### Acceptance
- An attendee submits a 1–5 review → row with **their** `user_id`,
  `is_approved = false`, invisible publicly until approved.
- A non-attendee is rejected; a second review by the same user → `409`.
- A user cannot set `is_approved`/`is_flagged` from the body.
- After admin approval, the review appears in the public list and the aggregate.

---

## TASK-D10-002 — Social sharing (dynamic OG images)  **[no schema]**

**STATUS:** OPEN

- **Dynamic Open Graph images** per event via Next.js `ImageResponse`
  (`(public)/events/[slug]/opengraph-image.tsx` + `twitter-image.tsx`), rendered
  from real event data (title, date, venue, banner). No secrets; pull data via
  the public route/server fetch.
- **Per-page metadata:** `generateMetadata` on the event detail page sets
  `title`/`description`/`openGraph`/`twitter` so shared links preview correctly.
- **Share UI:** a share control on the event page — copy-link, and Web Share API
  (`navigator.share`) with graceful fallback to intent links (X/Telegram/
  WhatsApp/Facebook) using the canonical event URL.

### Acceptance
- A shared event URL renders a correct, event-specific preview card (verify the
  generated `opengraph-image` route returns an image).
- Share control copies the canonical URL and invokes the native share sheet
  where supported.

---

## TASK-D10-003 — Calendar (ICS + Google Calendar)  **[dep: `ics`]**

**STATUS:** OPEN
**Dep:** `ics` (install if missing).

```
api/protected/calendar/route.ts        # GET — ICS for the caller's registered events
```
- **Per-event add-to-calendar** (public is fine — it's public event data): a
  helper that builds a single-VEVENT `.ics` download and a **Google Calendar
  deep link** (`https://calendar.google.com/calendar/render?action=TEMPLATE&...`
  with URL-encoded `text`/`dates`/`details`/`location`).
- **"My events" ICS** (protected): the route streams a multi-VEVENT calendar of
  the caller's non-cancelled registrations (`createAuthedClient`).
- **Timezone correctness:** events carry a `timezone` (default
  `Africa/Addis_Ababa`). Emit correct UTC/`DTSTART` so the event lands at the
  right local time. Escape `,`/`;`/newlines per RFC 5545.

### Acceptance
- The `.ics` download imports into Apple/Google Calendar at the correct time.
- The Google Calendar deep link opens a prefilled event.
- The protected "my events" feed returns only the caller's events.

---

## TASK-D10-004 — Premium UI pass (P4)

**STATUS:** OPEN
**Spec:** `EXECUTION_BLUEPRINT.md` design rules (semantic tokens, Outfit/Inter,
card/button patterns, Framer Motion easing `[0.25,0.1,0.25,1]`, 44px touch
targets, glassmorphism), `BLUEPRINT_PAGES_PUBLIC.md`.

- Reviews section on the event page (star summary + distribution + list +
  "write a review" gated on attendance). Share control. Add-to-calendar buttons
  on event + ticket pages. All wired to real hooks; loading/empty/error states.
- Passes a **`ui-auditor`** pass before merge.

### Acceptance
- Event page shows real ratings + reviews, share, and add-to-calendar end to end.
  `ui-auditor` clean.

---

## GUARDRAILS
P1 Schema-First · P2 Factory · P3 Modularization · P4 Premium UI · P5 Docs · P6 Type-safety.

- Clone the merged modules; don't copy stale `IMPLEMENTATION_PHASE2.md` snippets.
- RLS is authz truth; `createAuthedClient` for protected paths; **add the review
  moderation fields to `SERVER_CONTROLLED_FIELDS`**; force `is_approved=false`.
- Reviews need an **attendance gate** (app-side) and map `23505 → 409`.
- No new migrations expected (reviews/RLS already exist). If you denormalize a
  rating onto `events`, that's a **new** migration (`024+`) with a maintained
  trigger — otherwise compute on read.
- Don't touch the `mvp-demo` branch; mobile is deferred.
- Optional while in these files: dedupe `escapeSearchTerm` (now duplicated in the
  public events route and `list-handler`) into one shared util.
- **Verify at runtime, not just `tsc`.** After build: kimi review → Opus auditor
  re-score → merge. **This is the last Phase 2 module — on merge, the web app is
  Phase 2 feature-complete and ready for Kidus's manual walkthrough.**
