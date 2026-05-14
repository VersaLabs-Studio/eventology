# Eventology — Types & Mock Data Specification

> **Prerequisite:** Complete `EXECUTION_BLUEPRINT.md` first.

---

## TypeScript Interfaces — `src/lib/types.ts`

```ts
export type EventStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
export type EventType = 'conference' | 'workshop' | 'meetup' | 'seminar' | 'networking' | 'concert' | 'exhibition' | 'training';
export type TicketType = 'free' | 'paid';
export type UserRole = 'attendee' | 'organizer' | 'admin';
export type RegistrationStatus = 'confirmed' | 'cancelled' | 'checked-in' | 'waitlisted';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;        // Lucide icon name
  description: string;
  eventCount: number;
  color: string;       // Tailwind color class
}

export interface TicketTier {
  id: string;
  name: string;        // e.g. "General", "VIP", "Early Bird"
  price: number;       // 0 for free
  currency: string;    // "ETB"
  capacity: number;
  sold: number;
  description: string;
}

export interface Organizer {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  avatar: string;      // URL
  bio: string;
  website?: string;
  verified: boolean;
  eventsCount: number;
  totalAttendees: number;
  joinedDate: string;
  socialLinks?: { twitter?: string; linkedin?: string; instagram?: string; };
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;     // Rich text HTML string
  shortDescription: string; // 1-2 sentences
  category: Category;
  type: EventType;
  status: EventStatus;
  date: string;            // ISO date
  endDate: string;
  time: string;            // "6:00 PM"
  endTime: string;
  location: string;        // Venue name
  address: string;         // Full address
  subCity: string;         // Addis Ababa sub-city
  coordinates: { lat: number; lng: number; };
  bannerImage: string;     // Unsplash URL
  gallery: string[];       // Array of Unsplash URLs
  organizer: Organizer;
  ticketTiers: TicketTier[];
  ticketType: TicketType;
  tags: string[];
  isFeatured: boolean;
  views: number;
  registrations: number;
  capacity: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: UserRole;
  isActive: boolean;
  joinedDate: string;
  eventsAttended: number;
}

export interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  ticketTier: string;
  status: RegistrationStatus;
  registeredAt: string;
  checkedInAt?: string;
  qrCode: string;
}

export interface Ticket {
  id: string;
  registrationId: string;
  eventId: string;
  event: Event;
  attendeeName: string;
  attendeeEmail: string;
  ticketTier: string;
  qrData: string;
  status: 'valid' | 'used' | 'cancelled';
  issuedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  actorRole: UserRole;
  target: string;
  details: string;
  timestamp: string;
}

export interface AnalyticsData {
  label: string;
  value: number;
}

export interface PlatformStats {
  totalEvents: number;
  totalRegistrations: number;
  activeUsers: number;
  totalOrganizers: number;
  growthRate: number;
  conversionRate: number;
}
```

---

## Mock Data Files

### `src/lib/mock-data/categories.ts`

8 categories. Each has: id, name, slug, icon (Lucide name), description, eventCount, color.

```
1. Tech & Innovation    | slug: tech          | icon: Cpu           | color: bg-blue-500     | 12 events
2. Business & Networking| slug: business      | icon: Briefcase     | color: bg-primary      | 9 events
3. Arts & Culture       | slug: arts          | icon: Palette       | color: bg-purple-500   | 7 events
4. Health & Wellness    | slug: health        | icon: Heart         | color: bg-rose-500     | 5 events
5. Education & Training | slug: education     | icon: GraduationCap | color: bg-amber-500    | 8 events
6. Music & Entertainment| slug: music         | icon: Music         | color: bg-pink-500     | 6 events
7. Food & Drink         | slug: food          | icon: UtensilsCrossed| color: bg-orange-500  | 4 events
8. Community & Social   | slug: community     | icon: Users         | color: bg-secondary    | 5 events
```

### `src/lib/mock-data/organizers.ts`

10 organizers. Use `https://randomuser.me/api/portraits/{men|women}/{N}.jpg` for avatars.

| # | Name | Verified | Events | Attendees |
|---|------|----------|--------|-----------|
| 1 | Addis Tech Hub | ✅ | 15 | 3200 |
| 2 | Ethiopian Business Forum | ✅ | 12 | 2800 |
| 3 | Meskel Cultural Foundation | ✅ | 8 | 1500 |
| 4 | Selam Wellness Center | ❌ | 4 | 600 |
| 5 | Habesha Innovators | ✅ | 10 | 2100 |
| 6 | Unity Training Institute | ❌ | 6 | 900 |
| 7 | Jazzamba Events | ✅ | 9 | 1800 |
| 8 | Green Ethiopia Foundation | ❌ | 3 | 450 |
| 9 | Addis Eats Collective | ❌ | 5 | 750 |
| 10 | Women in Tech Ethiopia | ✅ | 7 | 1400 |

### `src/lib/mock-data/events.ts`

**30 events minimum.** Each event must have ALL fields from the `Event` interface populated. Use these Unsplash photo IDs for banner images (append `?w=1200&h=600&fit=crop&q=80`):

**Event List (write all 30 with complete data):**

| # | Title | Category | Type | Sub-City | Venue | Date (2026) | Ticket | Featured |
|---|-------|----------|------|----------|-------|-------------|--------|----------|
| 1 | Addis Tech Summit 2026 | Tech | conference | Bole | Millennium Hall | Jun 15 | paid | ✅ |
| 2 | Ethiopian Coffee Masterclass | Food | workshop | Arada | Tomoca Heritage | Jun 8 | paid | ✅ |
| 3 | Startup Pitch Night: Bole | Business | networking | Bole | Ice Addis | Jun 20 | free | ✅ |
| 4 | Meskel Square Art Walk | Arts | exhibition | Lideta | Meskel Square | Jun 12 | free | ✅ |
| 5 | Women in Tech Addis | Tech | meetup | Bole | Hyatt Regency | Jun 25 | free | ✅ |
| 6 | Jazz Night at Jazzamba | Music | concert | Bole | Jazzamba Lounge | Jun 5 | paid | ❌ |
| 7 | Blockchain & Finance Forum | Business | seminar | Bole | Sheraton Addis | Jul 3 | paid | ❌ |
| 8 | Youth Entrepreneurship Workshop | Education | training | Kirkos | UNECA Center | Jun 18 | free | ❌ |
| 9 | Addis Yoga & Meditation Retreat | Health | workshop | Yeka | Yeka Hills Resort | Jun 22 | paid | ❌ |
| 10 | Ethiopian Film Festival 2026 | Arts | exhibition | Arada | National Theatre | Jul 10 | paid | ❌ |
| 11 | Cloud Computing Bootcamp | Tech | training | Bole | Addis ICT Village | Jun 28 | paid | ❌ |
| 12 | Addis Food Festival | Food | exhibition | Bole | Friendship Park | Jul 5 | free | ❌ |
| 13 | Digital Marketing Masterclass | Education | workshop | Bole | Capital Hotel | Jun 30 | paid | ❌ |
| 14 | Community Clean-Up Drive | Community | meetup | Kolfe Keranio | Kolfe Park | Jun 14 | free | ❌ |
| 15 | AI & Machine Learning Conference | Tech | conference | Bole | Skylight Hotel | Jul 8 | paid | ❌ |
| 16 | Afrobeats Night Live | Music | concert | Bole | Gaslight Lounge | Jun 19 | paid | ❌ |
| 17 | Sustainable Business Summit | Business | conference | Kirkos | Hilton Addis | Jul 12 | paid | ❌ |
| 18 | Traditional Medicine Workshop | Health | workshop | Arada | Arada Heritage | Jun 26 | free | ❌ |
| 19 | Photography Walk: Old Addis | Arts | meetup | Arada | Piazza District | Jun 10 | free | ❌ |
| 20 | React & Next.js Workshop | Tech | training | Bole | Ice Addis | Jul 1 | paid | ❌ |
| 21 | Networking Brunch for Founders | Business | networking | Bole | Garden of Coffee | Jun 16 | paid | ❌ |
| 22 | Kids Coding Camp | Education | training | Yeka | Yeka Tech Hub | Jul 7 | paid | ❌ |
| 23 | Addis Marathon Prep Run | Health | meetup | Bole | Bole Atlas | Jun 9 | free | ❌ |
| 24 | Poetry Open Mic Night | Arts | concert | Arada | Book Café | Jun 21 | free | ❌ |
| 25 | Fintech Innovation Day | Tech | seminar | Bole | Radisson Blu | Jul 15 | paid | ❌ |
| 26 | Ethiopian Wine Tasting | Food | workshop | Bole | Wine House | Jun 27 | paid | ❌ |
| 27 | Mental Health Awareness Walk | Health | meetup | Kirkos | Unity Park | Jun 13 | free | ❌ |
| 28 | Startup Legal Clinic | Business | seminar | Bole | Getfam Hotel | Jul 2 | free | ❌ |
| 29 | DJ Workshop & Beatmaking | Music | workshop | Bole | Studio 26 | Jun 24 | paid | ❌ |
| 30 | Volunteer Training Program | Community | training | Lideta | Red Cross Center | Jul 6 | free | ❌ |

**For each event, generate:**
- `description`: 3-4 paragraphs of HTML describing the event in detail
- `shortDescription`: 1-2 sentence summary
- `gallery`: 3-4 Unsplash URLs related to the event type
- `ticketTiers`: 1-3 tiers (free events have 1 tier with price 0, paid events have General + VIP minimum)
- `tags`: 3-5 relevant tags
- `views`: random between 150-5000
- `registrations`: random between 20-500 (less than capacity)
- `capacity`: 50-2000 depending on venue size
- `coordinates`: Use real Addis Ababa coordinates (~9.0°N, 38.7°E with small variations)

**Unsplash Image Strategy:**
Use these base URLs with event-appropriate photo IDs:
- Tech events: conference halls, laptops, presentations
- Business: networking, handshakes, office spaces
- Arts: galleries, paintings, performances
- Health: yoga, running, wellness
- Education: classrooms, workshops, students
- Music: concerts, instruments, DJ setups
- Food: Ethiopian food, coffee, cooking
- Community: volunteering, groups, parks

Example format: `https://images.unsplash.com/photo-1540575467063-178a50e2fd60?w=1200&h=600&fit=crop&q=80`

### `src/lib/mock-data/users.ts`

15 users across all roles:
- 8 attendees, 4 organizers (matching organizer data), 3 admins
- Use `https://api.dicebear.com/7.x/avataaars/svg?seed={name}` for avatars
- Realistic Ethiopian names: Abebe, Tigist, Dawit, Meron, Yonas, Hanna, Bereket, Sara, Kidus, Frehiwot, etc.

### `src/lib/mock-data/registrations.ts`

50+ registrations spread across events. Mix of statuses. Include `checked-in` for past events.

### `src/lib/mock-data/analytics.ts`

Pre-computed chart data arrays:

```ts
// Views over time (last 30 days) — array of { label: 'May 1', value: 245 }
// Registration trends (last 30 days) — array of { label: 'May 1', value: 18 }
// Category distribution — array of { label: 'Tech', value: 35 }
// Sub-city distribution — array of { label: 'Bole', value: 42 }
// Hourly registration pattern — array of { label: '9AM', value: 12 }
// Platform growth (monthly) — array of { label: 'Jan', value: 1200 }

export const platformStats: PlatformStats = {
  totalEvents: 156,
  totalRegistrations: 12847,
  activeUsers: 8432,
  totalOrganizers: 89,
  growthRate: 23.5,
  conversionRate: 34.2,
};
```

### `src/lib/mock-data/audit-log.ts`

25+ entries with actions like:
- "Approved event: Addis Tech Summit 2026"
- "Rejected event: Unapproved Gathering" (with reason)
- "Verified organizer: Addis Tech Hub"
- "Featured event: Women in Tech Addis (7 days)"
- "Deactivated user: spam_account@mail.com"
- "Changed role: dawit@email.com → organizer"
- "Removed featured: Ethiopian Film Festival"

### `src/lib/mock-data/index.ts`

Barrel export everything + helper functions:

```ts
export * from './events';
export * from './categories';
export * from './organizers';
export * from './users';
export * from './registrations';
export * from './analytics';
export * from './audit-log';

// Helper functions
export function getEventBySlug(slug: string): Event | undefined { ... }
export function getEventsByCategory(categorySlug: string): Event[] { ... }
export function getFeaturedEvents(): Event[] { ... }
export function getUpcomingEvents(): Event[] { ... }
export function getEventRegistrations(eventId: string): Registration[] { ... }
export function searchEvents(query: string): Event[] { ... }
export function getEventsBySubCity(subCity: string): Event[] { ... }
export function getOrganizerEvents(organizerId: string): Event[] { ... }
export function getPlatformStats(): PlatformStats { ... }
```

**Important:** All helper functions filter/search the mock arrays. `searchEvents` should search across title, description, organizer name, tags, and location.
