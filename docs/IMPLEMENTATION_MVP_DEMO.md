# Eventology — MVP Demo Implementation Reference

> **Branch:** `mvp-demo`
> **Status:** ✅ Complete
> **Purpose:** Preserve the approved UI demo + Expo mobile demo for marketing team

---

## What Lives on This Branch

### Web Demo (Original)
- Next.js 16 app with 80+ components across 3 tiers
- Mock data in `src/lib/mock-data/` (30 events, 10 organizers, 15 users, 50+ registrations)
- 20 Radix UI primitives in `src/components/ui/`
- Domain components in `src/components/public/`, `src/components/dashboard/`, `src/components/admin/`
- Pages: Home, Events, Event Detail, Search, Registration, Tickets, My Events, Organizer Dashboard, Admin Panel
- **No backend, no auth, no API routes — pure mock data**

### Mobile Demo (Expo)
- Expo SDK 56 app in `apps/mobile/`
- 6 screens with mock data:

| Screen | Route | Description |
|--------|-------|-------------|
| Home | `/(tabs)/index.tsx` | Featured carousel, category grid, upcoming events |
| Discover | `/(tabs)/discover.tsx` | Event listing with category filter chips |
| Search | `/(tabs)/search.tsx` | Real-time keyword search |
| My Tickets | `/(tabs)/tickets.tsx` | Ticket cards with QR placeholders, Upcoming/Past tabs |
| Profile | `/(tabs)/profile.tsx` | User stats, settings menu, logout |
| Event Detail | `/event/[slug].tsx` | Banner, meta card, ticket tiers, organizer, sticky register bar |

### Shared Mock Data (Mobile)
- 10 events (subset of web's 30)
- 8 categories with icons and colors
- 5 organizers (3 verified, 2 unverified)
- 5 mock tickets (3 valid, 1 used, 1 future)
- 1 mock user (Abebe Kebede)

---

## Design Tokens (Mobile)

```typescript
colors = {
  primary: "#16a34a",     // Eventology green
  accent: "#0ea5e9",      // Sky blue
  background: "#fafafa",  // Light background
  card: "#ffffff",        // White cards
  foreground: "#0a0a0a",  // Near-black text
  muted: "#737373",       // Secondary text
  border: "#e5e5e5",      // Light borders
  destructive: "#ef4444", // Error red
  success: "#22c55e",     // Success green
  warning: "#f59e0b",     // Warning amber
}
```

---

## Deployment

- **Web:** Continues to deploy on Vercel from `mvp-demo` branch
- **Mobile:** `eas build --platform all --profile preview` for internal distribution

---

## Key Files

```
apps/mobile/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      # 5-tab navigator
│   │   ├── index.tsx         # Home/Discovery
│   │   ├── discover.tsx      # Event listing
│   │   ├── search.tsx        # Search
│   │   ├── tickets.tsx       # My Tickets
│   │   └── profile.tsx       # Profile
│   ├── event/
│   │   └── [slug].tsx        # Event detail
│   └── _layout.tsx           # Root Stack
├── components/
│   ├── EventCard.tsx         # 3 variants: default, featured, compact
│   ├── CategoryChip.tsx      # Category filter chip
│   ├── TicketCard.tsx        # Ticket with QR placeholder
│   └── EmptyState.tsx        # Zero-data state
├── lib/
│   ├── theme.ts              # Design tokens
│   └── mock-data.ts          # All mock data + helpers
└── package.json
```

---

*© 2026 VersaLabs Studio. All rights reserved.*
