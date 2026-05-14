# Eventology — Polish, Animations & Final QA

> **Prerequisite:** Complete all pages from all 3 tiers first.

---

## Phase 6: Animations & Micro-interactions

### Page Transitions
Wrap page content in Framer Motion `motion.div` with:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
>
  {/* page content */}
</motion.div>
```

### Scroll Animations
Homepage sections use `whileInView` animation:
```tsx
<motion.section
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6 }}
>
```

### Card Hover Effects
All event cards and stat cards:
```tsx
<motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
```
Combined with CSS: `hover:shadow-lg transition-shadow duration-200`

### Button Interactions
```tsx
<motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}>
```

### Skeleton Loading States
Every page that displays data should show skeletons for 500ms (simulated loading):
- Use `useState` with `useEffect` to set `isLoading = true` initially, then `false` after 500ms
- During loading: render skeleton variants of cards, tables, charts
- Event card skeleton: image placeholder (bg-muted animate-pulse aspect-video), 3 text line placeholders
- Table skeleton: 5 rows of pulsing rectangles
- Chart skeleton: pulsing rectangle with chart-like shape

### Number Counter Animation
Stat card values animate from 0 to target value on mount:
- Create `useCountUp(target, duration)` hook
- Use `requestAnimationFrame` for smooth counting
- Duration: 1.5 seconds with ease-out

### Sidebar Animation
Collapsible sidebar uses Framer Motion `layout` animation:
- Width transitions smoothly between 240px and 64px
- Nav labels fade out when collapsed
- Logo switches between full and icon-only

### Toast Notifications
Use Sonner for all user actions:
- Registration: `toast.success("Registration successful! Check your email for the ticket.")`
- Approve event: `toast.success("Event approved and published.")`
- Reject event: `toast("Event rejected. The organizer has been notified.")`
- CSV Export: `toast.success("CSV file exported successfully.")`
- Check-in: `toast.success("John Doe checked in successfully!")`

### Featured Carousel
Auto-advance every 5 seconds. Smooth slide transition. Pause on hover. Dot indicators at bottom with active dot accent-colored.

---

## Phase 7: Responsive Design

### Breakpoints
```
sm: 640px    — 2-column event grids
md: 768px    — sidebar visible, 2-column layouts
lg: 1024px   — 3-column event grids, full sidebar
xl: 1280px   — max-width containers, 4-column grids where applicable
```

### Mobile Navigation (< 768px)
- Navbar: hamburger icon replaces nav links
- Click hamburger → full-screen overlay with nav links, auth buttons, close button
- Animate: slide in from right
- Body scroll locked when open

### Mobile Event Grid
- 1 column on `sm`, 2 columns on `md`, 3 on `lg`
- Cards stack vertically on mobile
- Banner images maintain aspect-video ratio

### Mobile Event Detail
- Single column layout (no sidebar)
- Ticket selection card moves below description
- Organizer card moves below tickets
- Map full-width
- Gallery: horizontal scroll instead of grid
- Sticky bottom bar with "Register" button and price (mobile CTA)

### Mobile Dashboard
- Sidebar: hidden by default, triggered by hamburger in topbar
- Opens as full-width overlay on mobile
- Stats grid: 2 columns on mobile (instead of 4)
- Charts: full width, stacked vertically
- Tables: horizontal scroll with sticky first column

### Mobile Filter
- Filter sidebar: hidden on mobile
- "Filters" button appears (with badge showing active filter count)
- Click → slide-up bottom sheet with all filter options
- "Apply Filters" button at bottom of sheet

### Touch Targets
All interactive elements: minimum `h-11 w-11` (44px) clickable area.
Buttons: `py-2.5 px-4` minimum on mobile.

---

## Phase 7: Dark Mode

### Theme Toggle
Create `src/hooks/use-theme.ts`:
```ts
// Manages 'light' | 'dark' class on <html> element
// Persists to localStorage key 'eventology-theme'
// Defaults to 'light' (per project decision)
// Exports: { theme, toggleTheme, setTheme }
```

Place toggle in:
- Public navbar (Sun/Moon icon button)
- Dashboard topbar (Sun/Moon icon button)

### Dark Mode Colors
When `.dark` class is on `<html>`:
- All token overrides from globals.css `.dark` block apply automatically
- Images: no change (they stay colorful)
- Charts: update grid lines to `#1A5D43`, tooltip bg to card-dark
- Glassmorphism: `bg-card/80 backdrop-blur-xl` (works in both modes)

---

## Phase 8: Final Assembly

### Navigation Wiring
Add a mock "role switcher" in the root or navbar for demo purposes:
- Small dropdown (top-right or footer) with: "View as Attendee" | "View as Organizer" | "View as Admin"
- Each option navigates to the respective tier's main page
- This allows demo reviewers to easily switch between all 3 tiers

### Cross-Tier Links
- Public event detail → "Manage this event" link (visible as demo, goes to organizer event page)
- Organizer dashboard → "View public site" link in topbar
- Admin moderation → clicking event title opens public event detail in new tab

### SEO Metadata (all pages)
Every page must have:
```tsx
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description for SEO',
};
```

### Not Found Page — `src/app/not-found.tsx`
Centered content: large "404" (font-display text-9xl font-bold text-primary/20), "Page not found" title, description, "Go Home" button, "Browse Events" link.

### Favicon
Use the logo SVG or extract the infinity symbol mark. Place in `public/favicon.ico` and `public/icon.svg`. Add to metadata in root layout.

---

## Verification Checklist

Run these checks before considering the build complete:

### Build
```bash
npm run build   # Must complete with 0 errors
npm run lint     # Must complete with 0 warnings
```

### Visual QA — All Pages Load
- [ ] Homepage (`/`)
- [ ] Event Discovery (`/events`)
- [ ] Event Detail (`/events/addis-tech-summit-2026`)
- [ ] Search (`/search?q=tech`)
- [ ] Registration (`/register/evt_001`)
- [ ] Digital Ticket (`/ticket/tkt_001`)
- [ ] My Events (`/my-events`)
- [ ] Login (`/auth/login`)
- [ ] Signup (`/auth/signup`)
- [ ] Org Dashboard (`/org/dashboard`)
- [ ] Org Events (`/org/events`)
- [ ] Org Create Event (`/org/events/create`)
- [ ] Org Event Detail (`/org/events/evt_001`)
- [ ] Org Registrations (`/org/events/evt_001/registrations`)
- [ ] Org Analytics (`/org/events/evt_001/analytics`)
- [ ] Org Check-In (`/org/events/evt_001/check-in`)
- [ ] Org Drafts (`/org/drafts`)
- [ ] Admin Dashboard (`/admin/dashboard`)
- [ ] Admin Moderation (`/admin/moderation`)
- [ ] Admin Featured (`/admin/featured`)
- [ ] Admin Users (`/admin/users`)
- [ ] Admin Organizers (`/admin/organizers`)
- [ ] Admin Audit Log (`/admin/audit-log`)
- [ ] 404 Page (any invalid URL)

### Responsive
- [ ] All pages at 375px (mobile)
- [ ] All pages at 768px (tablet)
- [ ] All pages at 1440px (desktop)

### Features Working
- [ ] Event card hover animations
- [ ] Filter sidebar filters events
- [ ] Search returns results
- [ ] Registration form shows success state
- [ ] QR code renders on ticket page
- [ ] Charts render with data
- [ ] Dark mode toggles correctly
- [ ] Role switcher navigates between tiers
- [ ] Skeleton loading states appear
- [ ] Toast notifications fire on actions
- [ ] Sidebar collapses/expands
- [ ] Mobile nav opens/closes

---

*End of Execution Blueprint. Build in order: Phase 1 → 8. Run `npm run build` after each phase.*
