# Eventology — Component Specifications

> **Prerequisite:** Complete `EXECUTION_BLUEPRINT.md` and `BLUEPRINT_TYPES_AND_DATA.md` first.

---

## UI Primitives (`src/components/ui/`)

Build these first — they are domain-agnostic, reusable across all tiers. Use `class-variance-authority` (CVA) for variant management. All components must accept `className` prop and merge via `cn()`.

### `button.tsx`
Variants: `default` (bg-primary), `secondary` (bg-secondary), `accent` (bg-accent), `outline` (border-border bg-transparent), `ghost` (hover:bg-muted), `destructive` (bg-destructive), `link` (underline)
Sizes: `sm` (h-8 px-3 text-xs), `default` (h-10 px-6 text-sm), `lg` (h-12 px-8 text-base), `icon` (h-10 w-10)
All buttons: `rounded-lg font-medium transition-all duration-200 focus-visible:ring-2 ring-ring ring-offset-2 disabled:opacity-50`

### `card.tsx`
Exports: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
Card base: `bg-card text-card-foreground rounded-xl border border-border shadow-sm`
Hover variant (add prop `hoverable`): `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`

### `badge.tsx`
Variants: `default` (bg-primary/10 text-primary), `secondary` (bg-secondary/10 text-secondary-foreground), `accent` (bg-accent/10 text-accent), `outline` (border), `success` (bg-green-100 text-green-800), `warning` (bg-orange-100 text-orange-800), `destructive` (bg-red-100 text-red-800)
Base: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`

### `input.tsx`
Base: `h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors`

### `textarea.tsx`
Same as input but `min-h-[120px] py-2` and resizable.

### `select.tsx`
Wrap Radix `Select`. Style trigger like input. Dropdown: `bg-card border border-border rounded-lg shadow-lg p-1`. Items: `rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer`

### `dialog.tsx`
Wrap Radix `Dialog`. Overlay: `fixed inset-0 bg-black/40 backdrop-blur-sm`. Content: `bg-card rounded-2xl border shadow-xl p-6 max-w-lg mx-auto animate-in fade-in zoom-in-95`

### `dropdown-menu.tsx`
Wrap Radix `DropdownMenu`. Content: `bg-card border rounded-lg shadow-lg p-1 min-w-[180px]`. Items: `rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer flex items-center gap-2`

### `tabs.tsx`
Wrap Radix `Tabs`. List: `inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 gap-1`. Trigger: `rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all`

### `avatar.tsx`
Wrap Radix `Avatar`. Base: `relative flex shrink-0 overflow-hidden rounded-full`. Sizes: `sm` (h-8 w-8), `default` (h-10 w-10), `lg` (h-14 w-14), `xl` (h-20 w-20). Fallback: `bg-primary/10 text-primary font-medium flex items-center justify-center`

### `skeleton.tsx`
Base: `animate-pulse rounded-lg bg-muted`. Accept `className` for custom sizing.

### `separator.tsx`
Wrap Radix `Separator`. `bg-border` with 1px height (horizontal) or width (vertical).

### `tooltip.tsx`
Wrap Radix `Tooltip`. Content: `bg-foreground text-background rounded-md px-3 py-1.5 text-xs shadow-lg animate-in fade-in`

### `switch.tsx`
Wrap Radix `Switch`. Track: `h-6 w-11 rounded-full bg-border data-[state=checked]:bg-primary transition-colors`. Thumb: `h-5 w-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5`

### `progress.tsx`
Wrap Radix `Progress`. Track: `h-2 w-full rounded-full bg-muted overflow-hidden`. Indicator: `h-full rounded-full bg-primary transition-all duration-500`

### `data-table.tsx`
Generic table component. Props: `columns: Column[]`, `data: T[]`, `searchable?: boolean`, `searchPlaceholder?: string`.
Features: sortable headers (click to toggle asc/desc), search input at top, responsive (horizontal scroll on mobile).
Styling: `w-full border-collapse`. Header: `bg-muted/50 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3`. Rows: `border-b border-border px-4 py-3 text-sm hover:bg-muted/30 transition-colors`

### `chart.tsx`
Recharts wrapper. Export `AreaChartComponent`, `BarChartComponent`, `DonutChartComponent`.
Use brand colors: primary `#065F46`, secondary `#84CC16`, accent `#F97316`.
All charts: responsive container, clean grid lines (`stroke="#E5E7EB"`), rounded tooltips.

---

## Shared Components (`src/components/shared/`)

### `logo.tsx`
Props: `size?: 'sm' | 'default' | 'lg'` (32px, 40px, 80px height). Renders the SVG from `/logo.svg` using `next/image` or inline SVG. Link wraps to `/`.

### `navbar.tsx`
**Public navbar** — sticky top-0, `bg-white/80 backdrop-blur-xl border-b border-border z-50`.
Layout: Logo (left) → Nav links (center: Discover, Categories, Search) → Auth buttons (right: Log In, Sign Up as accent button).
Mobile: hamburger menu icon → slide-out sheet with all links.
Active link indicator: `text-primary font-medium` with bottom border accent.

### `footer.tsx`
4-column grid: Brand (logo + tagline + social icons), Discover (links), Organizers (links), Company (links).
Bottom bar: copyright + "Made in Addis Ababa 🇪🇹".
Background: `bg-foreground text-background` (dark footer on light page).

### `search-bar.tsx`
Props: `variant: 'hero' | 'compact'`. Hero: large with icon, rounded-2xl, shadow-lg, full width. Compact: standard input size for navbar.
Has search icon (Lucide `Search`), placeholder "Search events, organizers, or venues...", clear button on input.

### `event-card.tsx`
**This is the Golden Template component** — all other cards follow its pattern.
Props: `event: Event`, `variant?: 'grid' | 'horizontal' | 'featured'`.
Grid variant (default): Vertical card — banner image (aspect-video, rounded-t-xl), category badge (top-left overlay), featured badge (accent, top-right if featured), title (font-display, font-semibold), date + location row (with Calendar and MapPin icons), price indicator, organizer row (avatar + name).
Horizontal variant: flex-row, image on left (w-48), content on right.
Featured variant: larger, with gradient overlay on image, larger title.
All variants: `hoverable` card pattern.

### `event-card-horizontal.tsx`
Horizontal layout variant of event card for list views and search results.

### `category-pill.tsx`
Props: `category: Category`, `active?: boolean`. Rounded-full pill with icon + name. Active: `bg-primary text-primary-foreground`. Inactive: `bg-muted text-muted-foreground hover:bg-primary/10`.

### `filter-sidebar.tsx`
Sticky sidebar for event discovery. Sections:
1. **Categories** — checkboxes with category names
2. **Date Range** — "Today", "This Week", "This Month", "Custom" buttons
3. **Sub-City** — select dropdown (Bole, Arada, Kirkos, Lideta, Yeka, Kolfe Keranio, Nifas Silk-Lafto, Addis Ketema, Akaki Kality, Gulele)
4. **Price** — "All", "Free", "Paid" radio buttons
5. **Event Type** — checkboxes (conference, workshop, meetup, etc.)
6. Clear All Filters button at bottom

All filters use local state (no backend). Filters modify displayed event list.

### `stat-card.tsx`
Props: `title: string`, `value: string | number`, `change?: number` (percentage), `icon: LucideIcon`, `trend?: 'up' | 'down'`.
Card with icon (in primary/10 circle), large value (font-mono font-bold text-3xl), title below (text-muted-foreground text-sm), change badge (green for up, red for down).

### `page-header.tsx`
Props: `title: string`, `description?: string`, `action?: ReactNode` (button on right).
Flex row: left side has h1 title + description paragraph, right side has optional action button.

### `empty-state.tsx`
Props: `icon: LucideIcon`, `title: string`, `description: string`, `action?: { label: string, onClick: () => void }`.
Centered flex column with large muted icon, title, description, optional CTA button.

### `qr-code.tsx`
Wraps `qrcode.react` `QRCodeSVG`. Props: `data: string`, `size?: number`. Renders QR code with primary color foreground and white background, padded in a card.

### `map-embed.tsx`
Props: `location: string`, `coordinates: { lat: number; lng: number }`.
Renders a styled placeholder with MapPin icon, location text, and a `bg-muted rounded-xl` container simulating a map. Include "View on Google Maps" link that opens `https://maps.google.com/?q={lat},{lng}`.

### `rich-text-editor.tsx`
Mock editor — a textarea with a toolbar row above it. Toolbar has icon buttons: Bold, Italic, List, Link, Image, Heading. All buttons are visual-only (no real functionality). Textarea has `min-h-[300px]`.

### `image-upload.tsx`
Mock upload — dashed border container with Upload icon, "Click to upload" text, "PNG, JPG up to 5MB" subtitle. On "upload", show a hardcoded Unsplash image as the "uploaded" preview. Include remove button.

---

## Public Components (`src/components/public/`)

### `hero-section.tsx`
Full-viewport hero. Background: gradient from primary to `primary/80` with subtle pattern overlay. Content: large headline "Discover Amazing Events in Addis Ababa" (font-display text-5xl md:text-7xl font-bold text-white), subtitle paragraph (text-white/80), hero search bar, stats row ("2,000+ Events", "500+ Organizers", "50K+ Attendees" — with CountUp-style display). Optional: floating event cards in background with glassmorphism effect.

### `featured-carousel.tsx`
Horizontal scrollable carousel of 5 featured events. Each card is large (w-[400px]) with banner image, gradient overlay, event info overlay at bottom. Auto-scroll with dot indicators. Prev/next arrow buttons.

### `category-grid.tsx`
Grid of 8 category cards (4 columns on desktop, 2 on mobile). Each card: icon in colored circle, category name, event count, hover: scale + shadow. Links to `/events?category={slug}`.

### `registration-form.tsx`
Simple 3-field form: Full Name (input), Email (input type email), Phone (input type tel with +251 prefix). Submit button (accent). Form validation (required fields). On submit: show success state with confetti-style animation and link to ticket page.

### `ticket-view.tsx`
Digital ticket display. Card with: event banner (top), QR code (centered, large), attendee name, event title, date/time, venue/location, ticket tier, "Save Ticket" and "Add to Calendar" buttons. Print-friendly layout.

---

## Dashboard Components (`src/components/dashboard/`)

### `sidebar.tsx`
Collapsible sidebar (240px expanded, 64px collapsed). Logo at top. Nav items with Lucide icons: Dashboard (LayoutDashboard), Events (Calendar), Drafts (FileText), Settings (Settings). Active item: `bg-primary/10 text-primary border-r-2 border-primary`. Bottom: organizer avatar + name + collapse toggle.

### `topbar.tsx`
Flex row: breadcrumb (left), search + notifications bell + avatar dropdown (right). `bg-card border-b border-border h-16 px-6`.

### `event-form.tsx`
Multi-section form for event creation/editing. Sections:
1. Basic Info: title, short description, category select, event type select
2. Date & Time: date picker (input type date), start time, end time
3. Location: venue name, address, sub-city select, map embed preview
4. Media: banner image upload, gallery image upload (up to 4)
5. Description: rich text editor
6. Tickets: ticket tier editor (add tiers, set name/price/capacity)
7. Tags: tag input (comma-separated)
8. Actions: "Save as Draft", "Submit for Review" (accent button)

### `ticket-tier-editor.tsx`
Dynamic list of ticket tiers. Each row: tier name input, price input (with ETB prefix), capacity input, description textarea, remove button. "Add Tier" button at bottom. First tier pre-filled as "General Admission".

### `analytics-charts.tsx`
Grid of charts for per-event analytics:
1. Views over time (area chart, 30 days)
2. Registration trend (bar chart, 30 days)
3. Ticket tier distribution (donut chart)
4. Geographic distribution by sub-city (horizontal bar chart)

### `registration-table.tsx`
DataTable with columns: Attendee Name, Email, Phone, Ticket Tier, Status (badge), Date, Actions (view/check-in).
Above table: search input + filter by status dropdown + "Export CSV" button.

### `check-in-scanner.tsx`
Simulated QR scanner viewport. Shows a camera-shaped dark area with scan-line animation (green line moving up/down). Below: manual entry input for ticket code. Recent check-ins list below that. Stats: "X / Y checked in" progress bar.

---

## Admin Components (`src/components/admin/`)

### `admin-sidebar.tsx`
Same structure as dashboard sidebar but different nav items: Dashboard (BarChart3), Moderation (ShieldCheck), Featured (Star), Users (Users), Organizers (BadgeCheck), Audit Log (ScrollText). Accent color indicator for admin: small `bg-accent` dot or bar.

### `moderation-card.tsx`
Card showing event pending review. Includes: event banner thumbnail, title, organizer name + verified badge, submitted date, event date, category badge, description preview (truncated). Action buttons: "Approve" (primary), "Reject" (destructive). Reject shows a notes textarea modal.

### `user-table.tsx`
DataTable with columns: Avatar + Name, Email, Role (badge with role color), Status (active/inactive), Joined Date, Events Attended, Actions (dropdown: Change Role, Deactivate/Activate).

### `organizer-verification-card.tsx`
Card showing organizer application. Includes: avatar, name, email, bio preview, events count, website link, applied date. Action buttons: "Verify" (primary with BadgeCheck icon), "Reject" (destructive).

### `featured-event-manager.tsx`
List of currently featured events with: drag handle icon (visual only), event title, featured since date, duration selector (7/14/30 days), "Unpin" button. Below: "Add Featured Event" section with event search/select.

### `platform-stats.tsx`
Grid of 6 stat cards: Total Events, Total Registrations, Active Users, Active Organizers, Growth Rate (%), Conversion Rate (%). Below: two charts — Monthly Growth (area chart) and Category Distribution (donut chart).

### `audit-log-table.tsx`
DataTable with columns: Timestamp, Action, Actor (with role badge), Target, Details. Filterable by action type and date range. Alternating row colors for readability.
