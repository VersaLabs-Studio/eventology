# Eventology — Execution Blueprint (Master)

> **For:** Executing Agent  
> **Project:** Eventology — Event Management Platform (Addis Ababa)  
> **Scope:** Front-end only scaffold, all V1 features, deployed to Vercel  
> **Stack:** Next.js 15 (App Router), TypeScript Strict, Tailwind CSS 4, Framer Motion, Radix UI  
> **Theme:** Light mode primary, dark mode toggle available  
> **Logo:** Navbar only (use SVG from project root: `Eventology logo - First draft.svg`)

## Related Documents

Read these in order before building:
1. `docs/EXECUTION_BLUEPRINT.md` — **This file** (setup, design system, architecture)
2. `docs/BLUEPRINT_TYPES_AND_DATA.md` — TypeScript interfaces + all mock data
3. `docs/BLUEPRINT_COMPONENTS.md` — All UI primitives + shared components
4. `docs/BLUEPRINT_PAGES_PUBLIC.md` — Tier 1: Attendee pages (8 features)
5. `docs/BLUEPRINT_PAGES_ORGANIZER.md` — Tier 2: Organizer dashboard (7 features)
6. `docs/BLUEPRINT_PAGES_ADMIN.md` — Tier 3: Admin panel (6 features)
7. `docs/BLUEPRINT_POLISH.md` — Animations, responsive, dark mode, final QA

---

## PHASE 1: Project Initialization

### Step 1.1 — Create Next.js Project

```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

### Step 1.2 — Install Dependencies

```bash
npm install framer-motion @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-switch @radix-ui/react-select @radix-ui/react-avatar @radix-ui/react-separator @radix-ui/react-progress @radix-ui/react-slot @radix-ui/react-checkbox @radix-ui/react-popover lucide-react recharts sonner qrcode.react clsx tailwind-merge class-variance-authority
```

### Step 1.3 — Copy Logo

Copy `Eventology logo - First draft.svg` to `public/logo.svg`.

### Step 1.4 — Clean Starter Files

Delete all default content from `src/app/page.tsx`, `src/app/globals.css`. Remove any default `favicon.ico`.

---

## PHASE 1: Design System

### Brand Palette

| Token | Hex | Role |
|-------|-----|------|
| `primary` | `#065F46` | Headers, nav, buttons, key surfaces |
| `primary-foreground` | `#FFFFFF` | Text on primary backgrounds |
| `secondary` | `#84CC16` | Tags, badges, success, highlights |
| `secondary-foreground` | `#052E16` | Text on secondary backgrounds |
| `accent` | `#F97316` | CTAs, featured badges, hover, notifications |
| `accent-foreground` | `#FFFFFF` | Text on accent backgrounds |
| `background` | `#FAFAF9` | Page background |
| `foreground` | `#052E16` | Body text |
| `card` | `#FFFFFF` | Card surfaces |
| `card-foreground` | `#052E16` | Card text |
| `muted` | `#F5F5F4` | Muted backgrounds |
| `muted-foreground` | `#6B7280` | Secondary text, placeholders |
| `border` | `#E5E7EB` | Borders |
| `ring` | `#065F46` | Focus rings |
| `destructive` | `#EF4444` | Error, delete |
| `success` | `#84CC16` | Success states (alias of secondary) |
| `warning` | `#F97316` | Warning states (alias of accent) |

Dark mode overrides (toggled via class strategy):
| Token | Dark Value |
|-------|-----------|
| `background` | `#052E16` |
| `foreground` | `#F5F5F4` |
| `card` | `#0A3D2E` |
| `card-foreground` | `#F5F5F4` |
| `muted` | `#0D4A36` |
| `muted-foreground` | `#9CA3AF` |
| `border` | `#1A5D43` |
| `primary` | `#10B981` |
| `ring` | `#10B981` |

### File: `src/app/globals.css`

```css
@import "tailwindcss";

@theme {
  --color-primary: #065F46;
  --color-primary-foreground: #FFFFFF;
  --color-secondary: #84CC16;
  --color-secondary-foreground: #052E16;
  --color-accent: #F97316;
  --color-accent-foreground: #FFFFFF;
  --color-background: #FAFAF9;
  --color-foreground: #052E16;
  --color-card: #FFFFFF;
  --color-card-foreground: #052E16;
  --color-muted: #F5F5F4;
  --color-muted-foreground: #6B7280;
  --color-border: #E5E7EB;
  --color-ring: #065F46;
  --color-destructive: #EF4444;
  --color-success: #84CC16;
  --color-warning: #F97316;

  --font-display: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04);
  --shadow-glow: 0 0 20px rgb(6 95 70 / 0.15);
}

/* Dark mode overrides */
.dark {
  --color-background: #052E16;
  --color-foreground: #F5F5F4;
  --color-card: #0A3D2E;
  --color-card-foreground: #F5F5F4;
  --color-muted: #0D4A36;
  --color-muted-foreground: #9CA3AF;
  --color-border: #1A5D43;
  --color-primary: #10B981;
  --color-ring: #10B981;
}

/* Base styles */
* { @apply border-border; }

body {
  @apply bg-background text-foreground font-body antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-muted-foreground); }

/* Smooth scrolling */
html { scroll-behavior: smooth; }

/* Selection */
::selection {
  background: rgb(6 95 70 / 0.2);
  color: var(--color-foreground);
}
```

### File: `src/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Eventology — Endless Events, One Platform', template: '%s | Eventology' },
  description: 'Discover, attend, and organize events in Addis Ababa. The modern event management platform for Ethiopia.',
  keywords: ['events', 'Addis Ababa', 'Ethiopia', 'conferences', 'meetups', 'ticketing'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <body>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
```

### File: `src/lib/utils.ts`

```tsx
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatCurrency(amount: number): string {
  return `ETB ${amount.toLocaleString()}`;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
```

---

## Directory Structure (Complete)

```
src/
├── app/
│   ├── (public)/                    # Tier 1: Attendee
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Homepage
│   │   ├── events/
│   │   │   ├── page.tsx             # Discovery grid
│   │   │   └── [slug]/
│   │   │       └── page.tsx         # Event detail
│   │   ├── search/page.tsx
│   │   ├── register/[eventId]/page.tsx
│   │   ├── ticket/[ticketId]/page.tsx
│   │   ├── my-events/page.tsx
│   │   └── auth/
│   │       ├── login/page.tsx
│   │       └── signup/page.tsx
│   ├── (organizer)/                 # Tier 2: Organizer
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   ├── create/page.tsx
│   │   │   └── [eventId]/
│   │   │       ├── page.tsx
│   │   │       ├── registrations/page.tsx
│   │   │       ├── analytics/page.tsx
│   │   │       └── check-in/page.tsx
│   │   └── drafts/page.tsx
│   ├── (admin)/                     # Tier 3: Admin
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── moderation/page.tsx
│   │   ├── featured/page.tsx
│   │   ├── users/page.tsx
│   │   ├── organizers/page.tsx
│   │   └── audit-log/page.tsx
│   ├── layout.tsx                   # Root layout
│   ├── globals.css
│   └── not-found.tsx
├── components/
│   ├── ui/                          # Primitives (see BLUEPRINT_COMPONENTS.md)
│   ├── shared/                      # Cross-cutting smart components
│   ├── public/                      # Tier 1 specific
│   ├── dashboard/                   # Tier 2 specific
│   └── admin/                       # Tier 3 specific
├── lib/
│   ├── utils.ts
│   ├── types.ts                     # All TypeScript interfaces
│   └── mock-data/
│       ├── index.ts
│       ├── events.ts
│       ├── categories.ts
│       ├── organizers.ts
│       ├── users.ts
│       ├── registrations.ts
│       ├── tickets.ts
│       ├── analytics.ts
│       └── audit-log.ts
└── hooks/
    ├── use-theme.ts
    └── use-search.ts
```

---

## Design Rules (Non-Negotiable)

1. **Never use hardcoded colors** — always use semantic tokens (`bg-primary`, `text-foreground`, etc.)
2. **Font hierarchy** — `font-display` (Outfit) for all headings, `font-body` (Inter) for body text
3. **Card pattern** — All cards use: `bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200`
4. **Button primary** — `bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-2.5 font-medium transition-colors`
5. **Button accent** — `bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg px-6 py-2.5 font-medium`
6. **Badge pattern** — `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`
7. **Page max-width** — `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
8. **Section spacing** — `py-16 sm:py-20 lg:py-24` between major homepage sections
9. **Touch targets** — All interactive elements minimum 44px
10. **Images** — All from Unsplash: `https://images.unsplash.com/photo-{ID}?w={W}&h={H}&fit=crop&q=80`
11. **Glassmorphism** — For elevated overlays: `bg-white/80 backdrop-blur-xl border border-white/20`
12. **Animations** — Use Framer Motion. Standard easing: `[0.25, 0.1, 0.25, 1]`, duration: `0.3s` for micro, `0.5s` for page

---

## Vercel Deployment Config

### `next.config.ts`

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
};

export default nextConfig;
```

Vercel will auto-detect Next.js. No additional config needed.

---

## Build Order Summary

Execute documents in this exact order:
1. This file — set up project, design system, utilities
2. `BLUEPRINT_TYPES_AND_DATA.md` — types + mock data
3. `BLUEPRINT_COMPONENTS.md` — all components
4. `BLUEPRINT_PAGES_PUBLIC.md` — attendee pages
5. `BLUEPRINT_PAGES_ORGANIZER.md` — organizer pages
6. `BLUEPRINT_PAGES_ADMIN.md` — admin pages
7. `BLUEPRINT_POLISH.md` — animations, responsive, final QA

**After each phase, run `npm run build` to verify zero errors before proceeding.**
