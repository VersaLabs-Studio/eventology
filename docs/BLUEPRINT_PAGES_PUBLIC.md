# Eventology — Public Tier Pages (Attendee)

> **Prerequisite:** Complete components from `BLUEPRINT_COMPONENTS.md` first.

---

## Tier 1 Layout — `src/app/(public)/layout.tsx`

```tsx
// Wraps all public pages with Navbar + Footer
// Import Navbar and Footer from shared components
// Structure: <Navbar /> → <main className="min-h-screen">{children}</main> → <Footer />
```

---

## Page 1: Homepage — `src/app/(public)/page.tsx`

**URL:** `/`  
**SEO:** title "Eventology — Discover Events in Addis Ababa"

**Sections (top to bottom):**

### 1.1 Hero Section
- Full-width, `min-h-[85vh]` with `bg-gradient-to-br from-primary via-primary/95 to-primary/80`
- Subtle dot pattern overlay (`radial-gradient` with low opacity)
- Content centered: 
  - Eyebrow text: "✨ The #1 Event Platform in Addis Ababa" (text-secondary)
  - Headline: "Discover Amazing Events in Addis Ababa" (text-white, font-display, text-5xl md:text-7xl, font-bold, max-w-4xl)
  - Subtitle: "Find conferences, meetups, workshops, and more. Register in seconds." (text-white/70, text-xl, max-w-2xl)
  - Hero SearchBar component (variant="hero")
  - Stats row: 3 stat items inline — "2,000+ Events" | "500+ Organizers" | "50K+ Attendees" (text-white/80, font-mono for numbers)
- Floating decoration: 2-3 small event card previews at angles with glassmorphism, `absolute` positioned, visible only on lg+ screens

### 1.2 Featured Events
- Section title: "Featured Events" with accent underline decoration
- `FeaturedCarousel` component showing top 5 featured events
- "View All Events →" link

### 1.3 Category Grid
- Section title: "Browse by Category"
- `CategoryGrid` component — 8 categories in 4-col grid
- Each category card links to `/events?category={slug}`

### 1.4 Upcoming Events
- Section title: "Upcoming Events"
- Tabs: "All" | "This Week" | "Free" (using Tabs component)
- 3-column event card grid showing 6 events (filtered by tab)
- "See All Events →" link button

### 1.5 How It Works
- Section title: "How It Works"
- 3-step horizontal cards: 
  1. "Discover" (Search icon) — "Browse hundreds of events across Addis Ababa"
  2. "Register" (UserPlus icon) — "Sign up in 30 seconds with just your name, email, and phone"
  3. "Attend" (Ticket icon) — "Get your digital ticket with QR code and show up"
- Each card: icon in colored circle, title, description

### 1.6 CTA Banner
- Full-width `bg-primary` section with rounded-2xl inner container
- "Ready to create your own event?" headline
- "Join hundreds of organizers using Eventology" subtitle
- "Get Started" accent button → links to `/auth/signup`

---

## Page 2: Event Discovery — `src/app/(public)/events/page.tsx`

**URL:** `/events` (supports query params: `?category=tech&type=conference&subcity=bole&price=free&q=searchterm`)  
**SEO:** title "Discover Events"

**Layout:** 2-column — sidebar (280px, sticky) + main content area

### Left: Filter Sidebar
- `FilterSidebar` component
- All filter changes update local state and filter the displayed events array
- URL query params are read on mount to set initial filter state

### Right: Main Content
- Top bar: result count ("Showing 24 events"), sort dropdown (Date: Newest, Date: Oldest, Most Popular, Name A-Z)
- Event grid: 3 columns (lg), 2 columns (md), 1 column (sm)
- Each item is `EventCard` (variant="grid")
- "Load More" button at bottom (simulate infinite scroll — show 12 initially, add 12 on click from mock data)
- If no results: `EmptyState` with Search icon and "No events match your filters"

**Mobile:** Filter sidebar becomes a slide-out sheet triggered by a "Filters" button with filter icon.

---

## Page 3: Event Detail — `src/app/(public)/events/[slug]/page.tsx`

**URL:** `/events/addis-tech-summit-2026`  
**SEO:** title is event title, description is shortDescription

**Layout:** Article-style, max-w-5xl centered

### 3.1 Banner
- Full-width banner image (aspect-[21/9], rounded-2xl, overflow-hidden)
- Gradient overlay at bottom with event title, date, location overlaid
- Category badge (top-left), Featured badge if applicable (top-right)
- Share button (top-right corner): dropdown with Copy Link, Twitter, LinkedIn

### 3.2 Info Bar
- Sticky bar below banner with: Date (Calendar icon), Time (Clock icon), Location (MapPin icon), Price ("Free" or "From ETB X"), "Register Now" accent button
- Becomes sticky on scroll

### 3.3 Main Content (2-column on desktop)

**Left Column (65%):**
- "About This Event" section with rich HTML description (rendered with `dangerouslySetInnerHTML`)
- Tags row (badge pills)
- "Gallery" section with image grid (2x2 grid of gallery images, click to view larger in dialog)

**Right Column (35%, sticky):**
- **Ticket Selection Card** (bg-card, rounded-xl, border, shadow-md, sticky top-24)
  - Title: "Select Tickets"
  - List of ticket tiers: each has name, price, description, "Select" button
  - Capacity indicator (progress bar showing X/Y sold)
  - "Register Now" button (accent, full-width, large)
  - "Free Registration" or price displayed prominently

- **Organizer Card** (below tickets)
  - Avatar, name, verified badge
  - Bio (truncated)
  - Events count, total attendees
  - "View Profile" link
  - Social links if available

- **Location Card** (below organizer)
  - MapEmbed component
  - Venue name, full address, sub-city

### 3.4 Similar Events
- "You Might Also Like" section
- 3 event cards from same category (horizontal scroll on mobile)

---

## Page 4: Search — `src/app/(public)/search/page.tsx`

**URL:** `/search?q=tech`  
**SEO:** title "Search Results"

- Large search input at top (auto-focused, pre-filled from `q` param)
- Results count: "X results for 'tech'"
- Results as vertical list of `EventCardHorizontal` components
- If no results: empty state with suggestions ("Try searching for 'conference', 'workshop', or 'music'")

---

## Page 5: Registration — `src/app/(public)/register/[eventId]/page.tsx`

**URL:** `/register/evt_001`  
**SEO:** title "Register for {Event Title}"

**Layout:** Centered, max-w-lg

- Event summary card at top (banner thumbnail, title, date, location, selected ticket tier)
- `RegistrationForm` component (name, email, phone)
- Terms checkbox: "I agree to the terms and conditions"
- Submit button: "Complete Registration" (accent, full-width)
- **Success State:** Replace form with success card — check icon animation, "You're Registered!", ticket QR code preview, "View Your Ticket" button → links to `/ticket/{ticketId}`, "You'll receive a confirmation email with your QR code ticket"

---

## Page 6: Digital Ticket — `src/app/(public)/ticket/[ticketId]/page.tsx`

**URL:** `/ticket/tkt_001`  
**SEO:** title "Your Ticket — {Event Title}"

- `TicketView` component — styled like a physical ticket
- Top section: event banner (small), event title, organizer name
- Middle: large QR code (centered, 200px)
- Details grid: Attendee Name, Email, Ticket Tier, Date & Time, Venue, Address
- Bottom actions: "Download Ticket" button (primary), "Add to Calendar" button (outline)
- Reminder banner: "📧 Reminders will be sent 24h and 1h before the event" (info card with Clock icon)

---

## Page 7: My Events — `src/app/(public)/my-events/page.tsx`

**URL:** `/my-events`  
**SEO:** title "My Events"

- Page header: "My Events" with description "Your upcoming and past events"
- Tabs: "Upcoming (X)" | "Past (Y)"
- **Upcoming tab:** List of event cards (horizontal variant) with "View Ticket" button on each. Shows upcoming events sorted by date.
- **Past tab:** Same layout but with muted styling, "Attended" badge, and no ticket button.
- If empty: `EmptyState` with Calendar icon, "No events yet", "Discover events to get started" with CTA to `/events`

---

## Page 8: Auth Pages

### Login — `src/app/(public)/auth/login/page.tsx`
- Centered card (max-w-md), logo at top (large variant)
- Title: "Welcome back"
- Fields: Email, Password
- "Remember me" checkbox + "Forgot password?" link
- "Sign In" button (primary, full-width)
- Divider: "or continue with"
- Google + Apple sign-in buttons (outline, visual only)
- Footer: "Don't have an account? Sign up" link
- Background: subtle gradient or pattern

### Signup — `src/app/(public)/auth/signup/page.tsx`
- Same layout as login
- Title: "Create your account"
- Fields: Full Name, Email, Phone, Password
- Role selector: "I want to" → "Attend Events" | "Organize Events" (two cards to pick)
- "Create Account" button (accent, full-width)
- Footer: "Already have an account? Sign in" link

**Note:** Both auth pages are visual only. No actual authentication. Buttons can redirect to respective dashboards for demo purposes (Login → if "organizer" selected, go to `/dashboard`).
