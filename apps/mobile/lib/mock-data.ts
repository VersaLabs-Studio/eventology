/**
 * Eventology Mobile — Mock Data
 * Simplified subset from the web demo (mvp-demo branch).
 * 10 events, 8 categories, 5 organizers, mock user & tickets.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type EventStatus = "draft" | "pending" | "approved" | "rejected" | "cancelled";
export type EventType =
  | "conference"
  | "workshop"
  | "meetup"
  | "seminar"
  | "networking"
  | "concert"
  | "exhibition"
  | "training";
export type TicketType = "free" | "paid";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string; // Expo vector icon name
  description: string;
  eventCount: number;
  color: string;
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  capacity: number;
  sold: number;
  description: string;
}

export interface Organizer {
  id: string;
  name: string;
  slug: string;
  avatar: string;
  bio: string;
  verified: boolean;
  eventsCount: number;
  totalAttendees: number;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: Category;
  type: EventType;
  status: EventStatus;
  date: string;
  endDate: string;
  time: string;
  endTime: string;
  location: string;
  address: string;
  subCity: string;
  bannerImage: string;
  organizer: Organizer;
  ticketTiers: TicketTier[];
  ticketType: TicketType;
  tags: string[];
  isFeatured: boolean;
  views: number;
  registrations: number;
  capacity: number;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  eventsAttended: number;
  ticketsCount: number;
}

export interface MockTicket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventImage: string;
  ticketTier: string;
  qrData: string;
  status: "valid" | "used" | "cancelled";
  issuedAt: string;
}

// ─── Categories (8) ──────────────────────────────────────────────────────────

export const categories: Category[] = [
  {
    id: "cat_001",
    name: "Tech & Innovation",
    slug: "tech",
    icon: "laptop-outline",
    description: "Technology conferences, hackathons, and innovation meetups",
    eventCount: 12,
    color: "#3b82f6",
  },
  {
    id: "cat_002",
    name: "Business",
    slug: "business",
    icon: "briefcase-outline",
    description: "Business conferences, networking events, and entrepreneurship",
    eventCount: 9,
    color: "#16a34a",
  },
  {
    id: "cat_003",
    name: "Arts & Culture",
    slug: "arts",
    icon: "color-palette-outline",
    description: "Art exhibitions, cultural festivals, and creative workshops",
    eventCount: 7,
    color: "#a855f7",
  },
  {
    id: "cat_004",
    name: "Health & Wellness",
    slug: "health",
    icon: "heart-outline",
    description: "Yoga, meditation, fitness, and wellness retreats",
    eventCount: 5,
    color: "#f43f5e",
  },
  {
    id: "cat_005",
    name: "Education",
    slug: "education",
    icon: "school-outline",
    description: "Workshops, bootcamps, and professional development",
    eventCount: 8,
    color: "#f59e0b",
  },
  {
    id: "cat_006",
    name: "Music",
    slug: "music",
    icon: "musical-notes-outline",
    description: "Concerts, live performances, and music festivals",
    eventCount: 6,
    color: "#ec4899",
  },
  {
    id: "cat_007",
    name: "Food & Drink",
    slug: "food",
    icon: "restaurant-outline",
    description: "Food festivals, cooking classes, and tasting events",
    eventCount: 4,
    color: "#f97316",
  },
  {
    id: "cat_008",
    name: "Community",
    slug: "community",
    icon: "people-outline",
    description: "Community gatherings, volunteer events, and social meetups",
    eventCount: 5,
    color: "#0ea5e9",
  },
];

// ─── Organizers (5) ──────────────────────────────────────────────────────────

export const organizers: Organizer[] = [
  {
    id: "org_001",
    name: "Addis Tech Hub",
    slug: "addis-tech-hub",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "Leading technology community in Addis Ababa organizing conferences, hackathons, and tech meetups.",
    verified: true,
    eventsCount: 15,
    totalAttendees: 3200,
  },
  {
    id: "org_002",
    name: "Ethiopian Business Forum",
    slug: "ethiopian-business-forum",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    bio: "Bringing together entrepreneurs, investors, and business leaders to foster economic growth.",
    verified: true,
    eventsCount: 12,
    totalAttendees: 2800,
  },
  {
    id: "org_003",
    name: "Meskel Cultural Foundation",
    slug: "meskel-cultural-foundation",
    avatar: "https://randomuser.me/api/portraits/men/67.jpg",
    bio: "Preserving and promoting Ethiopian arts, culture, and heritage through events and exhibitions.",
    verified: true,
    eventsCount: 8,
    totalAttendees: 1500,
  },
  {
    id: "org_004",
    name: "Selam Wellness Center",
    slug: "selam-wellness",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    bio: "Holistic wellness center offering yoga, meditation, and health workshops in Addis Ababa.",
    verified: false,
    eventsCount: 4,
    totalAttendees: 600,
  },
  {
    id: "org_005",
    name: "Habesha Innovators",
    slug: "habesha-innovators",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    bio: "A collective of Ethiopian innovators working on cutting-edge technology and social impact projects.",
    verified: true,
    eventsCount: 10,
    totalAttendees: 2100,
  },
];

// ─── Events (10 — subset of 30 from web) ────────────────────────────────────

export const events: Event[] = [
  {
    id: "evt_001",
    slug: "addis-tech-summit-2026",
    title: "Addis Tech Summit 2026",
    shortDescription:
      "Ethiopia's premier tech conference featuring 50+ speakers, workshops, and a startup showcase at the Addis Ababa Exhibition Center.",
    category: categories[0],
    type: "conference",
    status: "approved",
    date: "2026-06-15T00:00:00+03:00",
    endDate: "2026-06-17T00:00:00+03:00",
    time: "9:00 AM",
    endTime: "6:00 PM",
    location: "Addis Ababa Exhibition Center",
    address: "Bole Sub-city, Near Meskel Square, Addis Ababa",
    subCity: "Bole",
    bannerImage:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop&q=80",
    organizer: organizers[0],
    ticketTiers: [
      {
        id: "tier_001",
        name: "General Admission",
        price: 500,
        currency: "ETB",
        capacity: 500,
        sold: 312,
        description: "Access to all main stage talks and exhibition area.",
      },
      {
        id: "tier_002",
        name: "VIP Pass",
        price: 1500,
        currency: "ETB",
        capacity: 100,
        sold: 67,
        description:
          "Front-row seating, exclusive networking dinner, and speaker meet-and-greet.",
      },
      {
        id: "tier_003",
        name: "Student Pass",
        price: 150,
        currency: "ETB",
        capacity: 200,
        sold: 145,
        description: "Discounted pass for students with valid ID.",
      },
    ],
    ticketType: "paid",
    tags: ["technology", "conference", "startup", "AI", "innovation"],
    isFeatured: true,
    views: 12500,
    registrations: 524,
    capacity: 800,
  },
  {
    id: "evt_002",
    slug: "ethiopian-coffee-masterclass",
    title: "Ethiopian Coffee Masterclass",
    shortDescription:
      "Learn the art of Ethiopian coffee from bean to cup with world-class baristas at Tomoca Coffee Bole.",
    category: categories[6],
    type: "workshop",
    status: "approved",
    date: "2026-06-20T00:00:00+03:00",
    endDate: "2026-06-21T00:00:00+03:00",
    time: "2:00 PM",
    endTime: "5:00 PM",
    location: "Tomoca Coffee Bole",
    address: "Bole Sub-city, Atlas Area, Addis Ababa",
    subCity: "Bole",
    bannerImage:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=600&fit=crop&q=80",
    organizer: organizers[3],
    ticketTiers: [
      {
        id: "tier_004",
        name: "Standard",
        price: 300,
        currency: "ETB",
        capacity: 30,
        sold: 22,
        description: "Hands-on workshop with tasting session.",
      },
      {
        id: "tier_005",
        name: "Premium",
        price: 600,
        currency: "ETB",
        capacity: 15,
        sold: 8,
        description: "Includes take-home coffee kit and certificate.",
      },
    ],
    ticketType: "paid",
    tags: ["coffee", "workshop", "culture", "Ethiopian"],
    isFeatured: true,
    views: 3200,
    registrations: 30,
    capacity: 45,
  },
  {
    id: "evt_003",
    slug: "startup-pitch-night-bole",
    title: "Startup Pitch Night: Bole",
    shortDescription:
      "Watch 10 promising Ethiopian startups pitch to top VCs and angel investors. Networking reception follows.",
    category: categories[1],
    type: "networking",
    status: "approved",
    date: "2026-06-22T00:00:00+03:00",
    endDate: "2026-06-23T00:00:00+03:00",
    time: "6:00 PM",
    endTime: "9:00 PM",
    location: "BlueMoon Hotel",
    address: "Bole Sub-city, Behind Edna Mall, Addis Ababa",
    subCity: "Bole",
    bannerImage:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=600&fit=crop&q=80",
    organizer: organizers[1],
    ticketTiers: [
      {
        id: "tier_006",
        name: "General",
        price: 200,
        currency: "ETB",
        capacity: 150,
        sold: 98,
        description: "Entry to pitch event and networking.",
      },
    ],
    ticketType: "paid",
    tags: ["startup", "pitch", "investing", "entrepreneurship"],
    isFeatured: true,
    views: 5800,
    registrations: 98,
    capacity: 150,
  },
  {
    id: "evt_004",
    slug: "meskel-square-art-walk",
    title: "Meskel Square Art Walk",
    shortDescription:
      "A guided walking tour of Addis Ababa's vibrant street art and public installations around Meskel Square.",
    category: categories[2],
    type: "meetup",
    status: "approved",
    date: "2026-06-10T00:00:00+03:00",
    endDate: "2026-06-11T00:00:00+03:00",
    time: "10:00 AM",
    endTime: "1:00 PM",
    location: "Meskel Square",
    address: "Kirkos Sub-city, Meskel Square, Addis Ababa",
    subCity: "Kirkos",
    bannerImage:
      "https://images.unsplash.com/photo-1513364776144-61c7e2c3b4ab?w=1200&h=600&fit=crop&q=80",
    organizer: organizers[2],
    ticketTiers: [
      {
        id: "tier_007",
        name: "Free Participant",
        price: 0,
        currency: "ETB",
        capacity: 50,
        sold: 32,
        description: "Free guided art walk.",
      },
    ],
    ticketType: "free",
    tags: ["art", "walking tour", "culture", "street art"],
    isFeatured: false,
    views: 2100,
    registrations: 32,
    capacity: 50,
  },
  {
    id: "evt_005",
    slug: "women-in-tech-addis",
    title: "Women in Tech Addis",
    shortDescription:
      "Empowering women in technology through mentorship talks, hands-on workshops, and networking at iCog Labs.",
    category: categories[0],
    type: "conference",
    status: "approved",
    date: "2026-06-25T00:00:00+03:00",
    endDate: "2026-06-26T00:00:00+03:00",
    time: "9:00 AM",
    endTime: "5:00 PM",
    location: "iCog Labs",
    address: "Bole Sub-city, Aware Area, Addis Ababa",
    subCity: "Bole",
    bannerImage:
      "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1200&h=600&fit=crop&q=80",
    organizer: organizers[4],
    ticketTiers: [
      {
        id: "tier_008",
        name: "Free Participant",
        price: 0,
        currency: "ETB",
        capacity: 100,
        sold: 78,
        description: "Free access to all sessions.",
      },
    ],
    ticketType: "free",
    tags: ["women in tech", "diversity", "mentorship", "AI"],
    isFeatured: true,
    views: 7200,
    registrations: 78,
    capacity: 100,
  },
  {
    id: "evt_006",
    slug: "jazz-night-at-jazzamba",
    title: "Jazz Night at Jazzamba",
    shortDescription:
      "An intimate evening of live Ethiopian jazz and international standards at the legendary Jazzamba Lounge.",
    category: categories[5],
    type: "concert",
    status: "approved",
    date: "2026-06-18T00:00:00+03:00",
    endDate: "2026-06-19T00:00:00+03:00",
    time: "8:00 PM",
    endTime: "11:30 PM",
    location: "Jazzamba Lounge",
    address: "Bole Sub-city, near Bole Medhanealem, Addis Ababa",
    subCity: "Bole",
    bannerImage:
      "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200&h=600&fit=crop&q=80",
    organizer: organizers[2],
    ticketTiers: [
      {
        id: "tier_009",
        name: "General",
        price: 250,
        currency: "ETB",
        capacity: 80,
        sold: 52,
        description: "Standard seating with welcome drink.",
      },
      {
        id: "tier_010",
        name: "VIP Table",
        price: 800,
        currency: "ETB",
        capacity: 20,
        sold: 12,
        description: "Reserved table with bottle service.",
      },
    ],
    ticketType: "paid",
    tags: ["jazz", "live music", "nightlife", "Ethiopian"],
    isFeatured: false,
    views: 4100,
    registrations: 64,
    capacity: 100,
  },
  {
    id: "evt_007",
    slug: "blockchain-and-finance-forum",
    title: "Blockchain & Finance Forum",
    shortDescription:
      "Exploring the future of decentralized finance and blockchain innovation in the Ethiopian financial sector.",
    category: categories[0],
    type: "seminar",
    status: "approved",
    date: "2026-07-05T00:00:00+03:00",
    endDate: "2026-07-06T00:00:00+03:00",
    time: "9:00 AM",
    endTime: "5:00 PM",
    location: "Hyatt Regency",
    address: "Bole Sub-city, Meskel Flower Road, Addis Ababa",
    subCity: "Bole",
    bannerImage:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=600&fit=crop&q=80",
    organizer: organizers[0],
    ticketTiers: [
      {
        id: "tier_011",
        name: "Standard",
        price: 600,
        currency: "ETB",
        capacity: 200,
        sold: 88,
        description: "Full access to all sessions.",
      },
      {
        id: "tier_012",
        name: "VIP",
        price: 1800,
        currency: "ETB",
        capacity: 40,
        sold: 15,
        description: "Includes executive lunch and private Q&A.",
      },
    ],
    ticketType: "paid",
    tags: ["blockchain", "finance", "DeFi", "cryptocurrency"],
    isFeatured: false,
    views: 3500,
    registrations: 103,
    capacity: 240,
  },
  {
    id: "evt_008",
    slug: "youth-entrepreneurship-workshop",
    title: "Youth Entrepreneurship Workshop",
    shortDescription:
      "A free 2-day workshop for young Ethiopians (18-30) covering business ideation, lean canvas, and MVP building.",
    category: categories[1],
    type: "training",
    status: "approved",
    date: "2026-06-28T00:00:00+03:00",
    endDate: "2026-06-30T00:00:00+03:00",
    time: "9:00 AM",
    endTime: "4:00 PM",
    location: "Impact Hub Addis",
    address: "Bole Sub-city, Wollo Sefer, Addis Ababa",
    subCity: "Bole",
    bannerImage:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=600&fit=crop&q=80",
    organizer: organizers[1],
    ticketTiers: [
      {
        id: "tier_013",
        name: "Free Participant",
        price: 0,
        currency: "ETB",
        capacity: 60,
        sold: 42,
        description: "Free workshop with materials and lunch.",
      },
    ],
    ticketType: "free",
    tags: ["entrepreneurship", "youth", "workshop", "startup"],
    isFeatured: false,
    views: 2800,
    registrations: 42,
    capacity: 60,
  },
  {
    id: "evt_009",
    slug: "addis-yoga-meditation-retreat",
    title: "Addis Yoga & Meditation Retreat",
    shortDescription:
      "A full-day wellness retreat featuring yoga sessions, guided meditation, and holistic health workshops at Entoto Park.",
    category: categories[3],
    type: "workshop",
    status: "approved",
    date: "2026-07-10T00:00:00+03:00",
    endDate: "2026-07-11T00:00:00+03:00",
    time: "7:00 AM",
    endTime: "4:00 PM",
    location: "Entoto Park",
    address: "Entoto Mountain, North of Addis Ababa",
    subCity: "Yeka",
    bannerImage:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&h=600&fit=crop&q=80",
    organizer: organizers[3],
    ticketTiers: [
      {
        id: "tier_014",
        name: "Standard",
        price: 400,
        currency: "ETB",
        capacity: 40,
        sold: 18,
        description: "Full retreat access with lunch.",
      },
      {
        id: "tier_015",
        name: "VIP",
        price: 900,
        currency: "ETB",
        capacity: 10,
        sold: 4,
        description: "Private session + wellness kit.",
      },
    ],
    ticketType: "paid",
    tags: ["yoga", "meditation", "wellness", "retreat"],
    isFeatured: false,
    views: 1800,
    registrations: 22,
    capacity: 50,
  },
  {
    id: "evt_010",
    slug: "ethiopian-film-festival-2026",
    title: "Ethiopian Film Festival 2026",
    shortDescription:
      "Celebrating Ethiopian cinema with 3 days of film screenings, director Q&As, and awards at the National Theatre.",
    category: categories[2],
    type: "exhibition",
    status: "approved",
    date: "2026-07-18T00:00:00+03:00",
    endDate: "2026-07-20T00:00:00+03:00",
    time: "10:00 AM",
    endTime: "9:00 PM",
    location: "National Theatre",
    address: "Arada Sub-city, near Meskel Square, Addis Ababa",
    subCity: "Arada",
    bannerImage:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&h=600&fit=crop&q=80",
    organizer: organizers[2],
    ticketTiers: [
      {
        id: "tier_016",
        name: "Day Pass",
        price: 150,
        currency: "ETB",
        capacity: 300,
        sold: 120,
        description: "Single day access to all screenings.",
      },
      {
        id: "tier_017",
        name: "Full Festival Pass",
        price: 350,
        currency: "ETB",
        capacity: 150,
        sold: 65,
        description: "All 3 days + awards ceremony.",
      },
    ],
    ticketType: "paid",
    tags: ["film", "cinema", "festival", "Ethiopian", "culture"],
    isFeatured: true,
    views: 6400,
    registrations: 185,
    capacity: 450,
  },
];

// ─── Mock User ───────────────────────────────────────────────────────────────

export const mockUser: MockUser = {
  id: "usr_001",
  name: "Abebe Kebede",
  email: "abebe.k@email.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Abebe",
  eventsAttended: 12,
  ticketsCount: 5,
};

// ─── Mock Tickets ────────────────────────────────────────────────────────────

export const mockTickets: MockTicket[] = [
  {
    id: "tkt_001",
    eventId: "evt_001",
    eventTitle: "Addis Tech Summit 2026",
    eventDate: "2026-06-15T00:00:00+03:00",
    eventTime: "9:00 AM",
    eventLocation: "Addis Ababa Exhibition Center",
    eventImage:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop&q=80",
    ticketTier: "VIP Pass",
    qrData: "TKT-001-A1B2C3-TECH2026",
    status: "valid",
    issuedAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "tkt_002",
    eventId: "evt_005",
    eventTitle: "Women in Tech Addis",
    eventDate: "2026-06-25T00:00:00+03:00",
    eventTime: "9:00 AM",
    eventLocation: "iCog Labs",
    eventImage:
      "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400&h=200&fit=crop&q=80",
    ticketTier: "Free Participant",
    qrData: "TKT-002-Y7Z8A9-WIT2026",
    status: "valid",
    issuedAt: "2026-05-14T09:00:00Z",
  },
  {
    id: "tkt_003",
    eventId: "evt_006",
    eventTitle: "Jazz Night at Jazzamba",
    eventDate: "2026-06-18T00:00:00+03:00",
    eventTime: "8:00 PM",
    eventLocation: "Jazzamba Lounge",
    eventImage:
      "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=200&fit=crop&q=80",
    ticketTier: "General",
    qrData: "TKT-003-E4F5G6-JAZZ2026",
    status: "valid",
    issuedAt: "2026-05-16T18:00:00Z",
  },
  {
    id: "tkt_004",
    eventId: "evt_003",
    eventTitle: "Startup Pitch Night: Bole",
    eventDate: "2026-03-22T00:00:00+03:00",
    eventTime: "6:00 PM",
    eventLocation: "BlueMoon Hotel",
    eventImage:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=200&fit=crop&q=80",
    ticketTier: "General",
    qrData: "TKT-004-H4I5J6-PITCH2025",
    status: "used",
    issuedAt: "2025-12-10T14:00:00Z",
  },
  {
    id: "tkt_005",
    eventId: "evt_010",
    eventTitle: "Ethiopian Film Festival 2026",
    eventDate: "2026-07-18T00:00:00+03:00",
    eventTime: "10:00 AM",
    eventLocation: "National Theatre",
    eventImage:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=200&fit=crop&q=80",
    ticketTier: "Full Festival Pass",
    qrData: "TKT-005-W4X5Y6-FILM2026",
    status: "valid",
    issuedAt: "2026-06-01T16:00:00Z",
  },
];

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getEventBySlug(slug: string): Event | undefined {
  return events.find((e) => e.slug === slug);
}

export function getFeaturedEvents(): Event[] {
  return events.filter((e) => e.isFeatured);
}

export function getUpcomingEvents(): Event[] {
  return [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function getEventsByCategory(categorySlug: string): Event[] {
  return events.filter((e) => e.category.slug === categorySlug);
}

export function searchEvents(query: string): Event[] {
  const q = query.toLowerCase();
  return events.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.shortDescription.toLowerCase().includes(q) ||
      e.organizer.name.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q)) ||
      e.location.toLowerCase().includes(q)
  );
}
