# Eventology — Organizer Tier Pages (Dashboard)

> **Prerequisite:** Complete all public tier pages first.

---

## Tier 2 Layout — `src/app/(organizer)/layout.tsx`

Dashboard shell with sidebar + topbar. Structure:
```
<div className="flex h-screen bg-background">
  <Sidebar />
  <div className="flex-1 flex flex-col overflow-hidden">
    <Topbar />
    <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
  </div>
</div>
```

Sidebar: `DashboardSidebar` component. Topbar: `DashboardTopbar` with breadcrumbs.
Use a mock organizer (first verified organizer from mock data) as the "logged-in" user.

---

## Page O1: Dashboard Overview — `src/app/(organizer)/dashboard/page.tsx`

**URL:** `/dashboard`  
**SEO:** title "Organizer Dashboard"

### Top: Stats Row
4 `StatCard` components in a row:
1. Total Events (Calendar icon, value: organizer's event count)
2. Total Registrations (Users icon, sum of all event registrations)
3. Total Views (Eye icon, sum of all event views)
4. Conversion Rate (TrendingUp icon, registrations/views as percentage)

Each stat card shows `+X%` change indicator (mock positive values).

### Middle: Charts Row (2-column grid)
1. **Registrations Over Time** — Area chart (last 30 days) with primary color fill
2. **Views Over Time** — Line chart (last 30 days) with secondary color

### Bottom: Recent Events Table
Table showing organizer's events with columns:
- Event Title (with small banner thumbnail)
- Date
- Status (badge: draft/pending/approved — color-coded)
- Registrations / Capacity
- Views
- Actions (dropdown: Edit, View Analytics, Duplicate, Preview)

Sort by date (newest first). Show 5 most recent.

"View All Events →" link to `/events` (organizer events page).

---

## Page O2: Events List — `src/app/(organizer)/events/page.tsx`

**URL:** `/dashboard/events` (adjust route if needed to match organizer tier)  

**Note:** Since Next.js route groups use parentheses, the actual URLs should be:
- Organizer pages can use `/org/dashboard`, `/org/events`, etc. as the URL path
- OR keep them under the `(organizer)` route group which doesn't affect URL

**Recommended URL structure for organizer tier:** Use a route group `(organizer)` but prefix actual paths:
```
src/app/(organizer)/org/dashboard/page.tsx    → /org/dashboard
src/app/(organizer)/org/events/page.tsx       → /org/events
src/app/(organizer)/org/events/create/page.tsx → /org/events/create
... etc
```

**Page Content:**
- Page header: "My Events" with "Create Event" accent button (links to create page)
- Filter tabs: "All" | "Published" | "Drafts" | "Pending" | "Rejected"
- Event list — each row is a card with: banner thumbnail (64px square), title, date, status badge, registrations count, views count, actions dropdown
- Clicking event title navigates to event management page

---

## Page O3: Create Event — `src/app/(organizer)/org/events/create/page.tsx`

**URL:** `/org/events/create`

- Page header: "Create New Event"
- `EventForm` component (see BLUEPRINT_COMPONENTS.md for full spec)
- Multi-step form or single long-scroll form with sections
- Sticky bottom action bar: "Save as Draft" (outline button), "Preview" (secondary), "Submit for Review" (accent)
- Preview button opens a dialog showing the event detail page preview (read-only render of the form data)

---

## Page O4: Event Management — `src/app/(organizer)/org/events/[eventId]/page.tsx`

**URL:** `/org/events/evt_001`

- Page header: event title with status badge, "Edit" button, "Duplicate" button, dropdown (Delete, Cancel Event)
- Tab navigation: "Overview" | "Registrations" | "Analytics" | "Check-In"
- **Overview tab** (default): Event detail preview (same layout as public detail page but in dashboard context), quick stat cards (views, registrations, capacity %)

---

## Page O5: Registrations — `src/app/(organizer)/org/events/[eventId]/registrations/page.tsx`

**URL:** `/org/events/evt_001/registrations`

- Page header: "Registrations" for {event title}
- Stats row: Total Registered, Checked In, Cancelled, Waitlisted (4 stat cards, smaller variant)
- `RegistrationTable` component with search, status filter, and CSV export button
- CSV export: button that generates a download (mock — show toast "CSV exported successfully")

---

## Page O6: Analytics — `src/app/(organizer)/org/events/[eventId]/analytics/page.tsx`

**URL:** `/org/events/evt_001/analytics`

- Page header: "Analytics" for {event title}
- Date range selector at top (Last 7 Days, Last 30 Days, All Time — buttons)
- `AnalyticsCharts` component with 4 charts:
  1. Views over time (area chart)
  2. Registration trend (bar chart)
  3. Ticket tier breakdown (donut chart)
  4. Registrations by sub-city (horizontal bar chart)
- Summary stats below charts: peak registration day, most popular ticket tier, top referral source (mock data)

---

## Page O7: QR Check-In — `src/app/(organizer)/org/events/[eventId]/check-in/page.tsx`

**URL:** `/org/events/evt_001/check-in`

- Page header: "QR Check-In" for {event title}
- Top: progress bar showing "X of Y attendees checked in" with percentage
- Main: `CheckInScanner` component (camera viewport mock)
- Below scanner: manual entry — input for ticket code + "Check In" button
- Recent check-ins: list of last 5 check-ins with name, time, status (animated entry)
- On successful scan/entry: green checkmark animation, attendee name, "Checked In!" toast

---

## Page O8: Drafts — `src/app/(organizer)/org/drafts/page.tsx`

**URL:** `/org/drafts`

- Page header: "Drafts" with count
- Grid of draft event cards (2-column). Each draft card shows:
  - Banner image (or placeholder if none)
  - Title (or "Untitled Event")
  - Last edited date
  - Completion indicator (progress bar: how many fields filled)
  - Actions: "Continue Editing" (primary), "Preview" (outline), "Delete" (ghost destructive)
- If no drafts: `EmptyState` with FileText icon, "No drafts yet", "Create your first event"
