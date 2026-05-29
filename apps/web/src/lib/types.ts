export type EventStatus = "draft" | "pending" | "approved" | "rejected" | "cancelled";
export type EventType = "conference" | "workshop" | "meetup" | "seminar" | "networking" | "concert" | "exhibition" | "training";
export type TicketType = "free" | "paid";
export type UserRole = "attendee" | "organizer" | "admin";
export type RegistrationStatus = "confirmed" | "cancelled" | "checked-in" | "waitlisted";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
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
  email: string;
  phone: string;
  avatar: string;
  bio: string;
  website?: string;
  verified: boolean;
  eventsCount: number;
  totalAttendees: number;
  joinedDate: string;
  socialLinks?: { twitter?: string; linkedin?: string; instagram?: string };
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
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
  coordinates: { lat: number; lng: number };
  bannerImage: string;
  gallery: string[];
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
  status: "valid" | "used" | "cancelled";
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
