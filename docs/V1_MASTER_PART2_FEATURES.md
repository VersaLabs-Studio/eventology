# Eventology V1 MVP — Feature Specifications & UI Mapping (Part 2 of 5)

> **Author:** Kidus Abdula — Lead SWE & Systems Architect  
> **Version:** 1.0.0  
> **Created:** May 25, 2026  
> **Classification:** Master Source of Truth — Cross-Agent Session Handover  
> **Status:** ✅ ARCHITECT APPROVED  
> **Platform Identity:** AI-NATIVE LLM-POWERED EVENT MANAGEMENT SYSTEM

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [AI Architecture Overview](#2-ai-architecture-overview)
3. [Tier 1: Public Platform Features](#3-tier-1-public-platform-features)
4. [Tier 2: Organizer Dashboard Features](#4-tier-2-organizer-dashboard-features)
5. [Tier 3: Admin Panel Features](#5-tier-3-admin-panel-features)
6. [Platform-Wide AI Features](#6-platform-wide-ai-features)
7. [Mobile App (Expo) Feature Mapping](#7-mobile-app-expo-feature-mapping)
8. [Design System Carry-Forward](#8-design-system-carry-forward)
9. [Data Seeding Requirements](#9-data-seeding-requirements)

---

## 1. Executive Summary

Part 2 defines **every feature** in the Eventology V1 MVP across all three tiers plus the mobile app. Each feature includes: description, user story, UI screen/component mapping, API endpoint, data dependencies, and explicit acceptance criteria. AI companion features are co-located with their parent features — they are NOT a separate section.

**Feature count summary:**

| Tier | Core Features | AI Features | Total |
|------|:------------:|:-----------:|:-----:|
| Public (Tier 1) | 12 | 6 | 18 |
| Organizer (Tier 2) | 17 | 8 | 25 |
| Admin (Tier 3) | 10 | 7 | 17 |
| Platform-Wide AI | — | 4 | 4 |
| Mobile-Only | 7 | — | 7 |
| **Total** | **46** | **25** | **71** |

---

## 2. AI Architecture Overview

### 2.1 OpenRouter Integration

All AI features use the OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`) via a shared `packages/ai/` package. The package provides:

- **`client.ts`** — OpenRouter client with automatic 8-model fallback chain
- **`prompts/`** — Standardized system prompt templates per AI function
- **`services/`** — 18 individual AI service functions (see Part 3 §5.2 for full specs)
- **`cache.ts`** — Response caching with configurable TTL per function
- **`types.ts`** — Request/response TypeScript types

### 2.2 Model Fallback Chain

```typescript
const MODEL_CHAIN = [
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',  // Primary: reasoning
  'openai/gpt-oss-120b:free',                             // Fallback 1: large
  'poolside/laguna-xs.2:free',                             // Fallback 2
  'poolside/laguna-m.1:free',                              // Fallback 3
  'arcee-ai/trinity-large-thinking:free',                  // Fallback 4: thinking
  'nvidia/nemotron-3-nano-30b-a3b:free',                   // Fallback 5
  'nvidia/nemotron-nano-9b-v2:free',                       // Fallback 6: lightweight
  'openai/gpt-oss-20b:free',                               // Fallback 7: last resort
];
```

### 2.3 Model Tier Mapping

| Task Complexity | Target Models | Use Cases |
|----------------|---------------|-----------|
| **Heavy reasoning** | Models 1–2 | Content moderation, fraud detection, analytics narration, report generation |
| **Medium generation** | Models 3–5 | Description generation, marketing copy, event summaries, recommendations |
| **Lightweight** | Models 6–8 | Auto-tagging, translation, simple chatbot responses |

### 2.4 Caching Strategy

| AI Function | Cache TTL | Cache Key Pattern |
|------------|-----------|-------------------|
| Event recommendations | 1 hour | `recommend:${userId}:${page}` |
| Event summary | 24 hours | `summary:${eventId}` |
| Auto-tags | 24 hours | `tags:${hash(title+description)}` |
| Content moderation | No cache | — |
| Translation | 7 days | `translate:${lang}:${hash(text)}` |
| Chatbot response | No cache | — |
| Analytics narrative | 1 hour | `analytics:${eventId}:${dateRange}` |
| Marketing copy | 4 hours | `marketing:${eventId}:${platform}` |

### 2.5 Rate Limiting

- **Per user:** 10 AI requests per minute (tracked via user profile ID)
- **Global:** 100 AI requests per minute (tracked via application-level counter)
- **Exceeded response:** `{ error: { code: "AI_RATE_LIMITED", message: "Please wait before making another AI request." } }`

---

## 3. Tier 1: Public Platform Features

### 3.1 Event Discovery Homepage

**Description:** The primary landing page. Displays featured events carousel, category grid, upcoming events feed, trending events, and AI-recommended events for logged-in users.

**User Story:** As an attendee, I want to see interesting events immediately when I visit the site, so I can quickly find something to attend.

**UI Screen:** `apps/web/src/app/(public)/page.tsx` → renders `home-page.tsx`

**Components:**
- `HeroSection` — Large banner with featured event or platform CTA
- `FeaturedCarousel` — Horizontally scrolling featured events (max 8)
- `CategoryGrid` — 8 category cards with icons and event counts
- `UpcomingEventsSection` — Chronologically sorted event cards
- `TrendingEventsSection` — Events with highest recent view velocity
- `RecommendedForYouSection` — AI-powered personalized feed (logged-in users only)
- `NearbyEventsSection` — GPS-based proximity results (if location permitted)

**API Endpoints:**
- `GET /api/public/events?featured=true&limit=8` → Featured events
- `GET /api/public/categories` → Category list with counts
- `GET /api/public/events?sort=starts_at&direction=asc&limit=12` → Upcoming
- `GET /api/public/events?sort=trending&limit=6` → Trending (by view velocity)
- `GET /api/protected/recommendations?limit=6` → AI recommendations (auth required)
- `GET /api/public/events/nearby?lat=X&lng=Y&radius=10` → Nearby events

**Data Dependencies:** `events`, `categories`, `event_views`, `profiles` (for recommendations)

**Acceptance Criteria:**
- [ ] Featured carousel displays up to 8 events with auto-rotation
- [ ] Category grid shows all active categories with accurate event counts
- [ ] Upcoming events load with infinite scroll pagination (12 per page)
- [ ] Trending section updates based on 24-hour view velocity
- [ ] "Recommended For You" section appears ONLY for logged-in users
- [ ] Nearby events appear only when user grants location permission
- [ ] Page loads in <1.5 seconds on 3G connection
- [ ] All sections animate in with Framer Motion stagger

---

### 3.2 Event Detail Page

**Description:** Full event view with all details, ticket tiers, organizer info, venue map, gallery, sponsors, reviews, AI-generated summary, and related events.

**User Story:** As an attendee, I want to see everything about an event on one page so I can decide whether to attend and register.

**UI Screen:** `apps/web/src/app/(public)/events/[slug]/page.tsx`

**Components:**
- `EventBanner` — Full-width banner image with gradient overlay
- `EventHeader` — Title, date, time, location badge, category badge
- `EventDescription` — Rich text content with AI summary toggle
- `TicketTierSelector` — Card grid of available tiers with prices and availability
- `OrganizerCard` — Organizer avatar, name, verified badge, bio, social links
- `VenueMap` — Leaflet map embed showing event location
- `EventGallery` — Image gallery lightbox
- `SponsorBar` — Sponsor logos grouped by tier
- `ReviewsSection` — Star ratings summary + individual review cards
- `AIEventSummary` — Collapsible TL;DR generated by AI
- `SimilarEvents` — AI-powered "Events Like This" (3-5 cards)
- `ShareButtons` — Social sharing (Twitter, Facebook, LinkedIn, WhatsApp, copy link)
- `AddToCalendarButton` — ICS download + Google/Apple Calendar deep links
- `RegisterCTA` — Sticky bottom bar with "Register Now" button and price

**API Endpoints:**
- `GET /api/public/events/[slug]` → Full event with organizer, tiers, sponsors
- `GET /api/public/events/[slug]/reviews?page=1&limit=10` → Paginated reviews
- `POST /api/protected/ai/event-summary` → AI summary (body: `{ eventId }`)
- `POST /api/protected/ai/similar-events` → AI similar events (body: `{ eventId }`)
- `POST /api/public/events/[slug]/view` → Track view (unauthenticated ok)

**Data Dependencies:** `events`, `ticket_tiers`, `organizers`, `venues`, `sponsors`, `reviews`, `event_views`

**Acceptance Criteria:**
- [ ] Banner image loads with blur-up placeholder
- [ ] Ticket tiers show accurate remaining capacity (`capacity - sold_count`)
- [ ] Sold-out tiers display "Sold Out" badge with waitlist option if enabled
- [ ] AI summary generates on-click with loading skeleton
- [ ] Similar events section populated by AI with 3-5 relevant suggestions
- [ ] Venue map renders with pin at exact coordinates
- [ ] Reviews show average rating (1-5 stars) with review count
- [ ] Share buttons generate proper OG meta preview
- [ ] Calendar button generates valid ICS file
- [ ] View tracking fires once per session per event
- [ ] Page is fully responsive (mobile: stacked layout, desktop: 2-column)

---

### 3.3 Smart Search & Filters

**Description:** Dual-mode search — traditional keyword/filter search AND AI natural language search. Users can type "tech events this weekend in Bole" and get intelligent results.

**User Story:** As an attendee, I want to search for events using natural language so I can find exactly what I'm looking for without navigating complex filters.

**UI Screen:** `apps/web/src/app/(public)/search/page.tsx`

**Components:**
- `SearchBar` — Input with AI toggle (💬 icon). Traditional mode uses standard search, AI mode parses natural language.
- `FilterSidebar` — Category checkboxes, date range picker, location/sub-city dropdown, price range slider, event type dropdown, free/paid toggle
- `SearchResults` — Event card grid with result count and sort options
- `AISearchExplanation` — When AI mode is used, shows "I found X events matching: [parsed intent]"
- `NoResults` — Empty state with suggestions

**API Endpoints:**
- `GET /api/public/search?q=keyword&category=X&dateFrom=X&dateTo=X&city=X&subCity=X&priceMin=X&priceMax=X&type=X&ticketType=X&sort=relevance&page=1` → Traditional search
- `POST /api/protected/ai/search` → AI NLP search (body: `{ query: "tech events this weekend in Bole" }`)

**AI Integration — Natural Language Search:**
- **Service function:** `searchWithNLP(naturalLanguageQuery, availableEvents)`
- **System prompt:** "You are a search query parser for an Ethiopian event platform. Extract structured filters from natural language queries. Return JSON with: keywords, category, dateRange, location, priceRange, eventType."
- **Model tier:** Lightweight (models 6-8) for speed
- **Fallback:** If AI parsing fails, fall back to traditional keyword search
- **Response format:**
  ```json
  {
    "parsed": {
      "keywords": ["tech"],
      "category": "technology",
      "dateRange": { "from": "2026-05-30", "to": "2026-05-31" },
      "location": { "subCity": "Bole" },
      "eventType": null,
      "priceRange": null
    },
    "explanation": "Showing tech events this weekend in Bole sub-city",
    "results": [/* event objects */]
  }
  ```

**Acceptance Criteria:**
- [ ] Traditional search returns results in <500ms
- [ ] AI search parses intent and returns structured results
- [ ] AI search shows explanation of how it interpreted the query
- [ ] Filters update URL params for shareable search links
- [ ] Empty state suggests popular categories and upcoming events
- [ ] Search results paginate with infinite scroll
- [ ] Full-text search matches title, description, organizer name, tags

---

### 3.4 Registration Flow

**Description:** Multi-step registration: select tier → enter details → apply promo code → payment (if paid) → confirmation + QR ticket.

**User Story:** As an attendee, I want to register for an event in under 30 seconds so the process doesn't feel like a barrier.

**UI Screen:** `apps/web/src/app/(public)/register/[eventId]/page.tsx`

**Components:**
- `TierSelection` — Card selector showing available tiers with prices
- `RegistrationForm` — Name, email, phone fields (pre-filled if logged in)
- `PromoCodeInput` — Collapsible promo code field with "Apply" button
- `OrderSummary` — Selected tier, price, promo discount, total
- `PaymentRedirect` — Chapa checkout redirect (for paid events)
- `RegistrationSuccess` — Confirmation message with ticket preview and download
- `WaitlistJoin` — Alternate flow when event is at capacity

**API Endpoints:**
- `POST /api/protected/registrations` → Create registration (body: `{ eventId, ticketTierId, promoCode? }`)
- `POST /api/protected/payments/init` → Initialize Chapa payment (for paid tiers)
- `POST /api/protected/registrations/waitlist` → Join waitlist

**Flow Logic:**
```
User selects tier
  ├── tier.price === 0 (FREE)
  │   └── POST /registrations → ticket created → success page
  └── tier.price > 0 (PAID)
      └── POST /payments/init → redirect to Chapa → webhook → ticket created → success page
```

**Acceptance Criteria:**
- [ ] Registration completes in ≤3 steps (tier → details → confirm)
- [ ] Logged-in users see pre-filled name, email, phone
- [ ] Free event registration creates ticket immediately (no payment step)
- [ ] Paid event redirects to Chapa checkout
- [ ] Promo code applies discount and updates order summary in real-time
- [ ] Invalid promo code shows clear error message
- [ ] Duplicate registration blocked (UNIQUE constraint on event_id + profile_id)
- [ ] At-capacity events show waitlist option (if organizer enabled)
- [ ] Success page shows QR ticket with download button
- [ ] Confirmation email and SMS sent on successful registration

---

### 3.5 Digital Ticket with QR Code

**Description:** Unique QR-coded digital ticket that can be displayed, downloaded, and used offline.

**UI Screen:** `apps/web/src/app/(public)/ticket/[ticketId]/page.tsx`

**Components:**
- `TicketCard` — Styled ticket with event name, date, time, venue, tier, attendee name
- `QRCodeDisplay` — Large QR code generated from `tickets.qr_data`
- `DownloadButton` — Download ticket as PNG/PDF
- `ShareButton` — Share ticket via native share or copy link

**API Endpoints:**
- `GET /api/protected/tickets/[ticketId]` → Ticket details with event info

**QR Payload:** `EVT-{ticketId}-{registrationId}-{hmac_signature}` — HMAC signed to prevent forgery.

**Acceptance Criteria:**
- [ ] QR code renders at 256x256 minimum
- [ ] Ticket page works offline (service worker cached)
- [ ] Download generates a styled ticket image (not just QR code)
- [ ] QR payload is HMAC-signed and verified on scan
- [ ] Cancelled/used tickets show appropriate status badge

---

### 3.6 My Events / History

**Description:** User's personal event dashboard with tabs: Upcoming, Past, Cancelled.

**UI Screen:** `apps/web/src/app/(public)/my-events/page.tsx`

**Components:**
- `EventTabs` — Tab bar: Upcoming | Past | Cancelled
- `MyEventCard` — Event card with registration status badge and ticket link
- `EmptyState` — Per-tab empty state with CTA to discover events

**API Endpoints:**
- `GET /api/protected/my-events?tab=upcoming|past|cancelled&page=1`

**Acceptance Criteria:**
- [ ] Upcoming tab shows events where `starts_at > NOW()` and status = confirmed
- [ ] Past tab shows events where `ends_at < NOW()`
- [ ] Cancelled tab shows registrations with status = cancelled
- [ ] Each card links to the ticket page
- [ ] Empty state shows "Discover Events" CTA

---

### 3.7 Event Reviews & Ratings

**Description:** Post-event feedback system. Attendees rate events 1-5 stars with optional text review.

**UI Screen:** Reviews section on event detail page + standalone review form

**Components:**
- `ReviewForm` — Star rating input (1-5) + title + text area + submit
- `ReviewCard` — Avatar, name, star rating, date, review text
- `RatingsSummary` — Average rating, rating distribution bar chart, total count

**API Endpoints:**
- `POST /api/protected/reviews` → Submit review (body: `{ eventId, rating, title?, content? }`)
- `GET /api/public/events/[slug]/reviews?page=1&limit=10`

**Acceptance Criteria:**
- [ ] Reviews only allowed after event ends AND user was registered
- [ ] One review per user per event (UNIQUE constraint)
- [ ] Star rating is required; title and content are optional
- [ ] Reviews go through moderation (status: pending → approved by admin)
- [ ] Rating distribution shows visual breakdown (5★: 40%, 4★: 30%, etc.)

---

### 3.8 Social Sharing with Dynamic OG Images

**Description:** Each event generates a dynamic OpenGraph image for rich social media previews.

**Components:**
- `ShareButtons` — Social sharing buttons (Twitter, Facebook, LinkedIn, WhatsApp, Copy Link)
- Dynamic OG image generated via Next.js `opengraph-image.tsx` route

**Implementation:**
- `apps/web/src/app/(public)/events/[slug]/opengraph-image.tsx` — Uses `ImageResponse` from `next/og`
- Renders event title, date, location, organizer name, and banner thumbnail onto a branded template

**Acceptance Criteria:**
- [ ] Sharing a link to Twitter/Facebook/LinkedIn shows rich preview card
- [ ] OG image includes event title, date, location, and Eventology branding
- [ ] Copy link button copies URL to clipboard with toast confirmation

---

### 3.9 Waitlist with Auto-Promotion

**Description:** When an event reaches capacity, attendees can join a waitlist. When a cancellation occurs, the next person is auto-promoted and notified.

**API Endpoints:**
- `POST /api/protected/registrations/waitlist` → Join waitlist
- Automated via Supabase Edge Function trigger on registration cancellation

**Flow:**
```
Event at capacity → User clicks "Join Waitlist"
  → Registration created with status='waitlisted', waitlist_position=N
  → When existing registration cancelled:
    → Edge Function triggers
    → Next waitlisted user auto-promoted (status='confirmed')
    → Ticket created
    → Email + SMS + Push notification sent
```

**Acceptance Criteria:**
- [ ] Waitlist button appears only when event is at capacity AND allow_waitlist=true
- [ ] Waitlist position displayed to user
- [ ] Auto-promotion triggers within 60 seconds of cancellation
- [ ] Promoted user receives email, SMS, and push notification

---

### 3.10 Promo Codes at Checkout

**Description:** Organizer-created discount codes applied during registration.

**Components:**
- `PromoCodeInput` — Text input with "Apply" button in registration flow

**API Endpoints:**
- `POST /api/protected/promo-codes/validate` → Validate code (body: `{ code, eventId, tierId }`)

**Acceptance Criteria:**
- [ ] Valid promo code shows discounted price in order summary
- [ ] Expired, used-up, or invalid codes show descriptive error
- [ ] Percentage discounts calculate correctly
- [ ] Fixed amount discounts don't reduce below 0
- [ ] Usage counter increments on successful registration

---

### 3.11 Calendar Integration

**Description:** Add-to-calendar functionality for registered events.

**Components:**
- `AddToCalendarButton` — Dropdown: Google Calendar | Apple Calendar | Download ICS

**Implementation:**
- ICS file generation using `ics` npm package or custom builder
- Google Calendar URL: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...`
- Apple Calendar: `.ics` file download

**Acceptance Criteria:**
- [ ] Google Calendar link opens pre-filled event in new tab
- [ ] ICS download opens in default calendar app
- [ ] Recurring events generate proper RRULE in ICS

---

### 3.12 Events Near Me

**Description:** GPS-based proximity discovery for nearby events.

**Components:**
- `NearbyEventsSection` — On homepage (if location granted)
- `LocationFilter` — Radius slider (1km–50km) in search filters

**API Endpoints:**
- `GET /api/public/events/nearby?lat=X&lng=Y&radius=10&limit=12`

**PostGIS Query:**
```sql
SELECT *, ST_Distance(coordinates, ST_MakePoint(lng, lat)::geography) AS distance
FROM events
WHERE status = 'approved'
  AND starts_at > NOW()
  AND ST_DWithin(coordinates, ST_MakePoint(lng, lat)::geography, radius_meters)
ORDER BY distance ASC
LIMIT 12;
```

**Acceptance Criteria:**
- [ ] Location permission requested with clear rationale message
- [ ] Default radius: 10km, adjustable 1-50km
- [ ] Distance displayed on each event card ("2.3 km away")
- [ ] Graceful degradation if location denied (section hidden)

---

### 3.13–3.18 AI-Powered Public Features

#### 3.13 AI Event Recommendations Engine

**Description:** Personalized event suggestions using collaborative + content-based hybrid filtering.

**UI:** "Recommended For You" section on homepage and "You Might Also Like" on event detail.

**Service function:** `recommendEvents(userProfile, registrationHistory, availableEvents)`

**System prompt:** "You are an event recommendation engine for Ethiopia. Given a user's past event registrations, preferred categories, and location, rank the available events by relevance. Return the top 6 event IDs with a brief reason for each recommendation."

**Model tier:** Medium (models 3-5)

**Cache TTL:** 1 hour per user

**Acceptance Criteria:**
- [ ] Shows 6 personalized events for logged-in users
- [ ] New users (no history) see popular/trending events instead
- [ ] Recommendations refresh every hour
- [ ] Each recommendation shows reason: "Based on your interest in tech events"

#### 3.14 AI Natural Language Search

Covered in §3.3 Smart Search & Filters above.

#### 3.15 AI Event Summarizer

**Description:** One-click TL;DR for long event descriptions.

**UI:** "Summarize" button on event detail page, expands to show AI-generated 2-3 sentence summary.

**Service function:** `generateEventSummary(description)`

**System prompt:** "Summarize the following event description in 2-3 concise sentences. Focus on: what the event is about, who it's for, and what attendees will gain."

**Model tier:** Lightweight (models 6-8) for speed

**Cache TTL:** 24 hours per event

**Acceptance Criteria:**
- [ ] Summary generates in <3 seconds
- [ ] Loading state shows skeleton text
- [ ] Summary is 2-3 sentences, accurate to source description
- [ ] Cached — subsequent clicks show instant result

#### 3.16 AI Discovery Chatbot

**Description:** Floating chat widget on all public pages for conversational event discovery.

**UI:** `ChatWidget` component — bottom-right corner, expandable chat panel.

**Service function:** `chatbotResponse(userMessage, context, conversationHistory)`

**System prompt:** "You are Eventology AI, a friendly event discovery assistant for Ethiopia. Help users find events, answer questions about the platform, and provide recommendations. You have access to the current event database. Be concise, helpful, and always include event links when suggesting events. If you don't know the answer, say so and suggest browsing the events page."

**Model tier:** Medium (models 3-5)

**Cache TTL:** No cache (conversational)

**Acceptance Criteria:**
- [ ] Chat widget is accessible from all public pages
- [ ] Chatbot responds in <5 seconds
- [ ] Conversation maintains context (last 10 messages)
- [ ] Suggested events include clickable links
- [ ] "I don't know" fallback for out-of-scope questions
- [ ] Mobile: FAB button opens bottom sheet chat

#### 3.17 AI "Events Like This" Suggestions

**Description:** On every event detail page, AI suggests 3-5 similar events.

**Service function:** `recommendEvents(null, null, availableEvents, { similarTo: eventId })`

**Acceptance Criteria:**
- [ ] Shows 3-5 similar events based on category, tags, and description similarity
- [ ] Displayed in horizontal scroll section on event detail page
- [ ] Excludes the current event from results

#### 3.18 AI Event Highlights Generator

**Description:** After an event ends, AI generates a recap/highlights summary.

**Service function:** `generateEventRecap(event, registrations, reviews)`

**System prompt:** "Generate a professional event recap for the following completed event. Include: attendance statistics, highlights, audience reception (from reviews), and key takeaways. Write in a celebratory, professional tone."

**Trigger:** Automated via AI Workflow Agent — runs 24 hours after event ends.

**Acceptance Criteria:**
- [ ] Recap auto-generates 24h after event end
- [ ] Shows on the event detail page as "Event Recap" section
- [ ] Includes attendance stats, review summary, and key highlights

---

## 4. Tier 2: Organizer Dashboard Features

### 4.1 Event Creation Wizard

**Description:** Multi-step form for creating events: Basics → Details → Tickets → Media → Preview → Submit.

**UI Screen:** `apps/web/src/app/(organizer)/org/events/create/page.tsx`

**Components:**
- `Stepper` — Progress indicator showing current step (1-6)
- **Step 1 - Basics:** Title, category (select), type (select), starts_at (datetime picker), ends_at, timezone
- **Step 2 - Details:** Description (rich text editor), short description, tags (multi-select with AI suggestions), recurring toggle, online/in-person toggle, venue selection or address input, map picker
- **Step 3 - Tickets:** Add ticket tiers (name, price, capacity, description, sales window), free/paid toggle
- **Step 4 - Media:** Banner image upload, gallery images upload (drag-drop), sponsor logos
- **Step 5 - Preview:** Full preview of event as it will appear publicly
- **Step 6 - Submit:** Review checklist, submit for moderation or save as draft

**AI Integration:**
- **AI Auto-Tagging:** After Step 2, auto-suggest tags from title + description
- **AI Description Generator:** Button in Step 2: "Generate with AI" — organizer provides bullet points, AI generates full description

**API Endpoints:**
- `POST /api/protected/events` → Create event
- `POST /api/protected/ai/generate-description` → AI description
- `POST /api/protected/ai/generate-tags` → AI tag suggestions
- `POST /api/protected/upload/event-banner` → Banner upload
- `POST /api/protected/upload/event-gallery` → Gallery upload

**Acceptance Criteria:**
- [ ] All 6 steps work with back/next navigation
- [ ] Draft saves persist between sessions (save to database with status='draft')
- [ ] AI description generator accepts bullet points and outputs formatted description
- [ ] AI auto-tags appear as suggestions (organizer can accept/modify/reject)
- [ ] Image uploads show preview thumbnails with delete option
- [ ] Validation prevents submission with missing required fields
- [ ] Submitted events go to status='pending_review'

---

### 4.2 Event Management List

**Description:** Organizer's event inventory with status badges, search, and batch actions.

**UI Screen:** `apps/web/src/app/(organizer)/org/events/page.tsx`

**Components:**
- `EventTable` — DataTable with columns: title, status badge, date, registrations/capacity, revenue, actions
- `StatusFilter` — Filter by draft/pending/approved/rejected/cancelled/completed
- `EventActions` — Dropdown: Edit, Clone, Cancel, View Analytics, View Registrations

**Acceptance Criteria:**
- [ ] Table shows all organizer's events sorted by creation date
- [ ] Status badges color-coded (draft=gray, pending=yellow, approved=green, rejected=red)
- [ ] Clone action creates a copy with "(Copy)" suffix and status='draft'
- [ ] Cancel action requires confirmation dialog with reason

---

### 4.3 Registration Management

**Description:** Attendee list for each event with search, filter, and CSV export.

**UI Screen:** `apps/web/src/app/(organizer)/org/events/[eventId]/registrations/page.tsx`

**Components:**
- `RegistrationTable` — DataTable: attendee name, email, phone, tier, status, registered_at, actions
- `StatusFilter` — Filter by confirmed/checked_in/cancelled/waitlisted
- `CSVExportButton` — Download all registrations as CSV
- `BulkActions` — Select multiple → batch cancel, batch check-in

**API Endpoints:**
- `GET /api/protected/events/[eventId]/registrations?status=X&search=X&page=1`
- `GET /api/protected/events/[eventId]/registrations/export` → CSV download

**Acceptance Criteria:**
- [ ] Table searchable by attendee name, email, or phone
- [ ] CSV export includes all fields
- [ ] Bulk check-in works for walk-in scenarios
- [ ] Waitlisted registrations show position number

---

### 4.4 QR Check-In System

**Description:** Camera-based QR scanner for attendee check-in at event doors.

**UI Screen:** `apps/web/src/app/(organizer)/org/events/[eventId]/check-in/page.tsx`

**Components:**
- `QRScanner` — Camera viewport with QR detection overlay
- `ManualEntry` — Text input for manual QR code data entry
- `CheckInResult` — Success (green) / Already Used (yellow) / Invalid (red) feedback card
- `LiveCheckInCounter` — Real-time counter: "142 / 300 checked in" with progress bar

**API Endpoints:**
- `POST /api/protected/check-in` → Verify QR + mark as checked-in (body: `{ qrData, eventId }`)

**Supabase Realtime:** Subscribe to `registrations` table changes for `event_id` filter — update counter live.

**Acceptance Criteria:**
- [ ] Camera scanner detects QR in <1 second
- [ ] Success: green flash + attendee name + tier displayed
- [ ] Already checked-in: yellow warning with check-in timestamp
- [ ] Invalid QR: red error with reason
- [ ] Manual entry fallback works
- [ ] Real-time counter updates across all scanner devices simultaneously
- [ ] Works on mobile browser (not just mobile app)

---

### 4.5 Per-Event Analytics

**Description:** Visual analytics dashboard for each event with AI-narrated insights.

**UI Screen:** `apps/web/src/app/(organizer)/org/events/[eventId]/analytics/page.tsx`

**Components:**
- `ViewsChart` — Line chart: views over time (7d, 30d, all-time toggles)
- `RegistrationChart` — Line chart: registrations over time
- `ConversionFunnel` — Views → Registrations → Check-ins conversion rates
- `RevenueBreakdown` — Pie chart by ticket tier
- `GeographicDistribution` — Map or bar chart of attendee locations
- `AIAnalyticsNarrative` — AI-generated written analysis of the data
- `StatCards` — Key metrics: total views, total registrations, conversion rate, revenue, avg rating

**AI Integration — Analytics Narrator:**
- **Service function:** `generateAnalyticsNarrative(analyticsData)`
- **System prompt:** "Analyze the following event analytics data and provide actionable insights in 3-4 sentences. Include: performance relative to similar events, registration trends, and specific recommendations for improvement."
- **Model tier:** Heavy reasoning (models 1-2)
- **Cache TTL:** 1 hour

**Acceptance Criteria:**
- [ ] All charts render with real data from the database
- [ ] Date range toggles work (7d, 30d, all-time)
- [ ] AI narrative generates actionable insights (not just restating numbers)
- [ ] Revenue shows breakdown by tier with commission deducted
- [ ] Geographic distribution shows Ethiopian city/sub-city breakdown

---

### 4.6–4.9 Additional Organizer Core Features

#### 4.6 Revenue Dashboard
- Total revenue, platform commission, net revenue
- Payout history table (date, amount, status, reference)
- Pending payout amount
- Revenue trend chart
- **Endpoint:** `GET /api/protected/organizer/revenue?period=30d`

#### 4.7 Promo Code Management
- Create promo code form (code, type: percentage/fixed, value, max uses, expiry, applicable tiers)
- Promo codes table with usage tracking
- Activate/deactivate toggle
- **Endpoint:** `POST/GET/PUT /api/protected/events/[eventId]/promo-codes`

#### 4.8 Sponsor Management
- Add sponsor form (name, logo upload, website, tier: platinum/gold/silver/bronze)
- Sponsor list with impression/click counters
- Drag-drop reorder within tier
- **Endpoint:** `POST/GET/PUT/DELETE /api/protected/events/[eventId]/sponsors`

#### 4.9 Team Management
- Invite team member form (email, role: admin/member/scanner)
- Team member list with role badges
- Remove team member
- Roles: owner (full access), admin (manage event), member (view analytics), scanner (check-in only)
- **Endpoint:** `POST/GET/DELETE /api/protected/organizer/team`

---

### 4.10–4.17 AI-Powered Organizer Features

#### 4.10 AI Event Description Generator
- **Trigger:** Button in event creation wizard Step 2
- **Input:** Title, type, 3-5 bullet points
- **Output:** Professional, SEO-optimized description (EN) + Amharic translation
- **Service:** `generateEventDescription(title, type, bulletPoints, language)`
- **Model tier:** Medium (models 3-5)

#### 4.11 AI Pricing Optimizer
- **Trigger:** Button in ticket tier configuration
- **Input:** Event details, similar events' pricing from database
- **Output:** Recommended price per tier with reasoning
- **Service:** `generatePricingSuggestion(event, similarEvents)`
- **Model tier:** Heavy reasoning (models 1-2)

#### 4.12 AI Attendee Insights
- **Trigger:** "Get Insights" button on registrations page
- **Output:** Natural language summary of attendee demographics and patterns
- **Service:** `generateAttendeeInsights(registrationData)`

#### 4.13 AI Marketing Copy Generator
- **Trigger:** "Generate Marketing Copy" button on event management page
- **Input:** Event details
- **Output:** Social media posts for Twitter, Facebook, LinkedIn, Instagram
- **Service:** `generateMarketingCopy(event, platform)`
- **UI:** Tabbed output with copy-to-clipboard per platform

#### 4.14 AI Performance Predictor
- **Trigger:** "Predict Performance" button on event creation preview step
- **Output:** Expected registrations, revenue, and check-in rate
- **Service:** `generatePerformancePrediction(event, historicalData)`

#### 4.15 AI Auto-Tagging
- **Trigger:** Automatic after title and description are entered in event creation
- **Output:** 5-8 suggested tags as dismissible chips
- **Service:** `generateEventTags(title, description)`
- **Model tier:** Lightweight (models 6-8)

#### 4.16 AI Analytics Narrator
Covered in §4.5 Per-Event Analytics above.

#### 4.17 AI Organizer Chatbot
- **Context:** Organizer dashboard — aware of organizer's events, registrations, revenue
- **System prompt:** "You are Eventology AI, an organizer support assistant. You help organizers manage their events, understand analytics, and use platform features. You can access the organizer's event data, registration statistics, and revenue information."
- **Capabilities:** Answer feature questions, pull stats, generate reports, suggest improvements

---

## 5. Tier 3: Admin Panel Features

### 5.1 Moderation Queue

**UI Screen:** `apps/web/src/app/(admin)/admin/moderation/page.tsx`

**Components:**
- `ModerationTable` — Events with status='pending_review': title, organizer, submitted date, category
- `ModerationDialog` — Event preview + Approve / Reject / Request Changes buttons + reviewer notes textarea
- `AIContentModerationBadge` — Shows AI pre-scan result: "AI: Likely Safe (92%)" or "AI: Flagged (65%)"

**AI Integration — Content Moderation:**
- **Service:** `moderateContent(title, description)`
- **System prompt:** "You are a content moderation system for an Ethiopian event platform. Analyze the event title and description for: inappropriate content, spam indicators, misleading claims, policy violations. Return a JSON object with: isApproved (boolean), confidence (0-1), flags (array of issues), reason (string)."
- **Model tier:** Heavy reasoning (models 1-2)
- **Auto-action:** If confidence > 0.95 AND isApproved, auto-approve (skip queue). If confidence > 0.90 AND !isApproved, auto-flag with reason.

**Acceptance Criteria:**
- [ ] Pending events show with newest first
- [ ] Admin can preview full event before decision
- [ ] Approve → status='approved', published_at=NOW()
- [ ] Reject → status='rejected', rejection_reason stored
- [ ] AI pre-scan badge shows on each event in queue
- [ ] High-confidence approvals auto-processed (admin can override)
- [ ] Audit log entry created for every moderation action

---

### 5.2 Featured Events Management

- Pin/unpin events to homepage featured carousel
- Set featured duration (start date, end date)
- Max 8 featured events at once
- **AI Integration:** AI Trending Detection auto-suggests events to feature based on viral registration patterns

---

### 5.3 User Management

**Components:**
- `UserTable` — DataTable: name, email, role badge, status, joined date, events attended
- Role change dropdown (attendee ↔ organizer — admin role requires separate flow)
- Activate/deactivate toggle
- User detail sidebar with full profile

---

### 5.4 Organizer Verification Workflow

**Components:**
- `VerificationQueue` — Pending organizer applications
- `VerificationDialog` — Review: org name, bio, website, uploaded documents (business license, etc.)
- Approve (adds verified badge) / Reject (with notes)

---

### 5.5 Platform Analytics Dashboard

**Components:**
- `PlatformStatCards` — Total events, registrations, active users, revenue, growth rate
- `EventsTrendChart` — Events created over time
- `RegistrationsTrendChart` — Registrations over time
- `RevenueTrendChart` — Platform revenue over time
- `TopCategoriesChart` — Bar chart: registrations by category
- `TopOrganizersTable` — Top 10 organizers by registrations
- `GeographicDistribution` — Events and registrations by city
- `AIPlatformHealthSummary` — AI-generated platform health narrative

**AI Integration — Platform Health Monitor:**
- **Service:** `generatePlatformHealthSummary(metrics)`
- **System prompt:** "Analyze the following platform metrics and provide a health summary. Highlight: growth trends, anomalies, areas needing attention, and positive milestones. Be specific with numbers."

---

### 5.6 Audit Log

**Components:**
- `AuditLogTable` — Timestamped log: actor, action, target, details
- Filterable by action type, actor, date range
- **AI Integration:** `analyzeAuditLog(query, auditEntries)` — ask questions in natural language

---

### 5.7 Category Management

- CRUD categories with name (EN + AM), slug, icon, color, sort order
- Activate/deactivate categories
- Event count display per category

---

### 5.8 Platform-Wide Announcements

- Create announcement form (title, body, target audience: all/attendees/organizers)
- Sends via in-app notification to all targeted users
- History of past announcements

---

### 5.9 Revenue & Commission Reporting

- Platform-wide revenue summary
- Commission earned by period
- Organizer payout queue (pending payouts, mark as processed)
- Export financial reports

---

### 5.10 Content Flagging Queue

- User-reported events or reviews
- Review reported content → remove / dismiss flag
- Reporter notification on resolution

---

### 5.11–5.17 AI-Powered Admin Features

#### 5.11 AI Content Moderation
Covered in §5.1 above.

#### 5.12 AI Fraud Detection
- **Service:** `detectFraud(registrationPattern)`
- **Detects:** Bulk registrations from same IP, disposable email domains, impossible travel patterns, duplicate phone numbers
- **UI:** Alert banner on moderation dashboard + dedicated fraud alerts page
- **Severity levels:** Low (informational), Medium (investigate), High (auto-block)

#### 5.13 AI Platform Health Monitor
Covered in §5.5 above.

#### 5.14 AI Audit Log Analyzer
- Natural language query input: "Show all event rejections this month"
- AI parses query, filters audit log, returns formatted results
- **Service:** `analyzeAuditLog(query, auditEntries)`

#### 5.15 AI Trending Events Detection
- Hourly automated check for events with unusual registration velocity
- Auto-suggests featuring events that are going viral
- **Trigger:** Supabase Edge Function on cron schedule

#### 5.16 AI Report Generator
- Generate PDF/markdown reports on demand
- Report types: monthly platform summary, organizer performance, category analysis, revenue report
- **Service:** `generateReport(reportType, data, dateRange)`

#### 5.17 AI Customer Support Bot
- Admin-configurable chatbot for user-facing support
- Handles: FAQ, registration help, payment issues, refund requests
- Escalation: if confidence < 0.6, show "Contact Support" with human agent routing
- **System prompt:** "You are Eventology Support, a customer service assistant. Answer user questions about: creating events, registering for events, payments, refunds, account issues. If you can't help, offer to connect with a human agent."

---

## 6. Platform-Wide AI Features

### 6.1 AI Translation Service

- **Service:** `translateContent(text, fromLang, toLang)`
- Translates event descriptions, notifications, and UI content between English and Amharic
- **Model tier:** Lightweight (models 6-8)
- **Cache TTL:** 7 days

### 6.2 AI Workflow Agents

Automated background tasks running as Supabase Edge Functions:

| Agent | Trigger | Action |
|-------|---------|--------|
| **Reminder Agent** | Cron: every 15 minutes | Check events starting in 24h/1h → send notifications |
| **Waitlist Agent** | DB trigger: registration cancelled | Auto-promote next waitlisted → create ticket → notify |
| **Moderation Agent** | DB trigger: event status='pending_review' | Auto-scan content → flag or auto-approve |
| **Recap Agent** | Cron: daily at midnight | Find events ended in last 24h → generate recaps |
| **Stale Draft Agent** | Cron: daily at 9am EAT | Find drafts older than 14 days → notify organizer |
| **Trending Agent** | Cron: every hour | Analyze registration velocity → suggest featuring |

### 6.3 AI Customer Support Chatbot

- Global floating chat widget on all pages
- Context-aware: adapts personality based on current page/tier
- Conversation history persisted in Supabase
- Escalation to human support when AI confidence is low

### 6.4 AI Content Generation Pipeline

Shared service powering all AI content generation:
- Event descriptions, marketing copy, social posts
- Email templates, analytics narratives, reports
- Event recaps, platform health summaries
- All go through the same OpenRouter client with fallback chain

---

## 7. Mobile App (Expo) Feature Mapping

### 7.1 Web → Mobile Feature Parity

| Web Feature | Mobile Equivalent | Mobile-Specific Notes |
|-------------|------------------|----------------------|
| Event Discovery Homepage | Home tab | Bottom sheet filters instead of sidebar |
| Event Detail Page | Event detail screen | Full-screen banner with parallax |
| Smart Search | Search tab | Voice search integration possible (V2) |
| Registration Flow | Register screen | Bottom sheet payment flow |
| Digital Ticket | Tickets tab | Fullscreen QR with brightness boost |
| My Events | Profile > My Events | |
| Reviews & Ratings | Review bottom sheet | Star input with haptic feedback |
| AI Chatbot | FAB button → Bottom sheet | |
| QR Check-In | Scanner screen (organizer) | Native camera with expo-camera |
| Organizer Dashboard | Limited dashboard views | Key metrics + check-in scanner |

### 7.2 Mobile-Only Features

| Feature | Package | Description |
|---------|---------|-------------|
| **Push Notifications** | `expo-notifications` | All notification types from §6.2 |
| **Native QR Scanner** | `expo-camera` | Barcode scanning for check-in |
| **Offline Ticket Access** | `@react-native-async-storage/async-storage` | Cache tickets locally for offline access |
| **Events Near Me (GPS)** | `expo-location` | Background location for proximity events |
| **Biometric Auth** | `expo-local-authentication` | Face ID / fingerprint for app unlock |
| **Share Sheet** | `expo-sharing` | Native OS share sheet for events/tickets |
| **Deep Linking** | `expo-linking` | Open specific event/ticket from URL or notification |

---

## 8. Design System Carry-Forward

### 8.1 Existing UI Primitives (20 — migrate from demo)

| # | Component | Status |
|---|-----------|--------|
| 1 | Button | ✅ Carry forward |
| 2 | Card | ✅ Carry forward |
| 3 | Badge | ✅ Carry forward |
| 4 | Input | ✅ Carry forward |
| 5 | Textarea | ✅ Carry forward |
| 6 | Select | ✅ Carry forward |
| 7 | Dialog | ✅ Carry forward |
| 8 | DropdownMenu | ✅ Carry forward |
| 9 | Tabs | ✅ Carry forward |
| 10 | Avatar | ✅ Carry forward |
| 11 | Skeleton | ✅ Carry forward |
| 12 | Separator | ✅ Carry forward |
| 13 | Tooltip | ✅ Carry forward |
| 14 | Switch | ✅ Carry forward |
| 15 | Progress | ✅ Carry forward |
| 16 | DataTable | ✅ Carry forward |
| 17 | Chart | ✅ Carry forward |
| 18 | Checkbox | ✅ Carry forward |
| 19 | Label | ✅ Carry forward |
| 20 | FooterCTA | ✅ Carry forward |

### 8.2 New UI Primitives (15 — build for V1)

| # | Component | Purpose | Dependency |
|---|-----------|---------|------------|
| 21 | FileUpload | Image/doc upload with drag-drop and preview | None (custom) |
| 22 | RichTextEditor | Event description editor | TipTap or Lexical |
| 23 | DateTimePicker | Event date/time selection | react-day-picker |
| 24 | MultiSelect | Tag selection, multi-category filter | Custom or cmdk |
| 25 | Stepper | Multi-step form wizard | Custom |
| 26 | MapPicker | Venue location selection | react-leaflet |
| 27 | QRCode | QR code display | qrcode.react (existing) |
| 28 | ChatWidget | AI chatbot floating widget | Custom |
| 29 | LanguageSwitcher | EN/AM toggle | Custom |
| 30 | NotificationBell | Header notification dropdown | Custom |
| 31 | SearchCombobox | Advanced search with suggestions | cmdk |
| 32 | StarRating | Review star input | Custom |
| 33 | StatCard | Dashboard metric with trend indicator | Custom |
| 34 | EmptyState | Zero-data state illustrations | Custom |
| 35 | Pagination | Cursor-based pagination controls | Custom |

### 8.3 Design Tokens

```css
/* Colors — OKLCH for perceptual uniformity */
--color-primary: oklch(0.55 0.18 145);        /* Eventology green */
--color-primary-hover: oklch(0.50 0.20 145);
--color-accent: oklch(0.65 0.15 230);          /* Sky blue */
--color-background: oklch(0.98 0 0);           /* Near white */
--color-foreground: oklch(0.15 0 0);           /* Near black */
--color-muted: oklch(0.55 0 0);                /* Gray text */
--color-card: oklch(1.0 0 0);                  /* White cards */
--color-border: oklch(0.90 0 0);               /* Light border */
--color-destructive: oklch(0.55 0.20 25);      /* Red */
--color-warning: oklch(0.70 0.15 85);          /* Amber */
--color-success: oklch(0.55 0.18 145);         /* Green (same as primary) */

/* Typography — Plus Jakarta Sans */
--font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
--font-display: 800;  /* ExtraBold for headings */
--font-heading: 700;  /* Bold for subheadings */
--font-body: 400;     /* Regular for body */
--font-medium: 500;   /* Medium for labels */

/* Spacing — 4px grid */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;

/* Border Radius */
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;

/* Animation — Framer Motion spring presets */
spring.snappy = { type: "spring", stiffness: 400, damping: 30 }
spring.gentle = { type: "spring", stiffness: 200, damping: 20 }
spring.bouncy = { type: "spring", stiffness: 300, damping: 15 }
```

### 8.4 Theme Rules

- **Light mode primary** — All public-facing pages default to light mode
- **Dark mode secondary** — Admin panel and organizer dashboard support dark mode toggle
- **Mobile adaptation:** 44px minimum touch targets, bottom sheet patterns for modals, haptic feedback on key actions

---

## 9. Data Seeding Requirements

### 9.1 Seed Data Specification

The testing team and internal audit require comprehensive, realistic mock data. All seed data goes in `supabase/migrations/017_seed_data.sql`.

| Entity | Count | Distribution |
|--------|:-----:|--------------|
| **Profiles** | 50+ | 40 attendees, 8 organizers, 2 admins |
| **Organizers** | 10 | 4 verified, 3 pending, 2 approved-unverified, 1 rejected |
| **Categories** | 8 | Conference, Workshop, Meetup, Seminar, Networking, Concert, Exhibition, Training |
| **Venues** | 12 | 6 in Addis Ababa (various sub-cities), 2 in Hawassa, 1 in Bahir Dar, 1 in Adama, 1 in Dire Dawa, 1 in Jimma |
| **Events** | 50+ | 20 approved, 10 pending, 5 draft, 5 rejected, 5 cancelled, 5 completed — spread across categories and cities |
| **Ticket Tiers** | 100+ | 2-3 tiers per event (Free, Early Bird, General, VIP) |
| **Registrations** | 200+ | 150 confirmed, 20 checked_in, 15 cancelled, 10 waitlisted, 5 no_show |
| **Tickets** | 170+ | Matching confirmed + checked_in registrations |
| **Payments** | 80+ | 60 completed, 10 pending, 5 failed, 5 refunded |
| **Reviews** | 40+ | Ratings 1-5 distributed normally (mean ~4.0) |
| **Promo Codes** | 8 | 3 active (percentage), 2 active (fixed), 2 expired, 1 maxed out |
| **Sponsors** | 15 | 2 platinum, 4 gold, 5 silver, 4 bronze — distributed across 5 events |
| **Notifications** | 50+ | Mixed types, 30 unread |
| **Audit Log** | 30+ | Various admin actions with timestamps |
| **Messages** | 20+ | Sample organizer broadcasts |

### 9.2 Seed Data Content Guidelines

- **Event titles:** Use realistic Ethiopian event names (e.g., "Addis Tech Summit 2026", "Ethiopian Coffee Festival", "Hawassa Business Networking Night")
- **Organizer names:** Use realistic organization names (e.g., "Addis TechHub", "Ethiopian Business Association", "Creative Ethiopia")
- **Locations:** Use real Addis Ababa sub-cities (Bole, Kirkos, Arada, Yeka, Lideta, Nifas Silk-Lafto, Kolfe Keranio, Addis Ketema, Akaki Kality, Gulele)
- **Coordinates:** Use real GPS coordinates for Ethiopian cities
- **Prices:** ETB currency, realistic ranges (500-5000 ETB for paid tiers)
- **Dates:** Events spread across the next 3 months + 5 past events with reviews

---

> **Next Document:** [V1_MASTER_PART3_INTEGRATIONS.md](./V1_MASTER_PART3_INTEGRATIONS.md) — Payment, SMS, email, push, AI/OpenRouter, i18n, maps, better-auth integration specifications.

---

*Eventology V1 MVP — Feature Specifications & UI Mapping Part 2 of 5*  
*© 2026 VersaLabs Studio. All rights reserved.*
