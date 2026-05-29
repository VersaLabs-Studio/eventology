// ============================================================================
// @eventology/schemas — Generated Database Types
// ============================================================================
// This file will be replaced by: supabase gen types typescript --project-id <ref>
// For now, hand-authored to match supabase/migrations/*.sql EXACTLY.
// Source of truth: SQL migrations, NOT this file.
// ============================================================================

// ---------------------------------------------------------------------------
// Enum types (match 002_enums.sql exactly)
// ---------------------------------------------------------------------------

export type UserRole = 'attendee' | 'organizer' | 'admin';

export type EventStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

export type EventType =
  | 'conference'
  | 'workshop'
  | 'meetup'
  | 'seminar'
  | 'networking'
  | 'concert'
  | 'exhibition'
  | 'training';

export type TicketType = 'free' | 'paid';

export type RegistrationStatus = 'confirmed' | 'cancelled' | 'checked_in' | 'waitlisted';

export type TicketStatus = 'valid' | 'used' | 'cancelled';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type PaymentMethod = 'pay_at_door' | 'chapa' | 'telebirr' | 'bank_transfer';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ConversationType = 'direct' | 'event_inquiry' | 'support';

export type MessageType = 'text' | 'image' | 'system';

export type NotificationType =
  | 'registration_confirmed'
  | 'event_reminder'
  | 'event_cancelled'
  | 'event_approved'
  | 'event_rejected'
  | 'new_registration'
  | 'payment_received'
  | 'message_received'
  | 'system_announcement';

export type AuditAction =
  | 'event_approved'
  | 'event_rejected'
  | 'event_featured'
  | 'event_unfeatured'
  | 'organizer_verified'
  | 'organizer_rejected'
  | 'user_role_changed'
  | 'user_deactivated'
  | 'user_activated'
  | 'registration_created'
  | 'payment_completed'
  | 'system_config_changed';

export type PromoDiscountType = 'percentage' | 'fixed';

export type SponsorTier = 'platinum' | 'gold' | 'silver' | 'bronze';

export type SectionType = 'general' | 'vip' | 'stage' | 'standing' | 'accessible';

export type SeatStatus = 'available' | 'reserved' | 'sold' | 'blocked';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type FeaturedDuration = '7_days' | '14_days' | '30_days';

// ---------------------------------------------------------------------------
// Row types (match table definitions exactly)
// ---------------------------------------------------------------------------

/** 003_users_profiles.sql — profiles table */
export interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  bio: string | null;
  website: string | null;
  social_links: Record<string, unknown>;
  preferences: Record<string, unknown>;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 004_organizers.sql — organizers table */
export interface OrganizerRow {
  id: string;
  profile_id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  social_links: Record<string, unknown>;
  is_verified: boolean;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  events_count: number;
  total_attendees: number;
  stripe_account_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** 004_organizers.sql — organizer_team_members table */
export interface OrganizerTeamMemberRow {
  id: string;
  organizer_id: string;
  profile_id: string;
  role: string;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 005_categories_venues.sql — categories table */
export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  color: string;
  event_count: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** 005_categories_venues.sql — venues table */
export interface VenueRow {
  id: string;
  name: string;
  slug: string;
  address: string;
  sub_city: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  location: unknown; // PostGIS geometry — not typed at app level
  capacity: number | null;
  description: string | null;
  image_url: string | null;
  amenities: string[];
  contact_phone: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** 006_events.sql — events table */
export interface EventRow {
  id: string;
  organizer_id: string;
  category_id: string;
  venue_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  banner_image: string | null;
  gallery: string[];
  event_type: EventType;
  ticket_type: TicketType;
  tags: string[];
  start_date: string;
  end_date: string;
  timezone: string;
  venue_name: string | null;
  venue_address: string | null;
  sub_city: string | null;
  latitude: number | null;
  longitude: number | null;
  location: unknown; // PostGIS geometry
  status: EventStatus;
  rejection_reason: string | null;
  is_featured: boolean;
  featured_until: string | null;
  capacity: number;
  registrations_count: number;
  views_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** 007_tickets_registrations.sql — ticket_tiers table */
export interface TicketTierRow {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  capacity: number;
  sold_count: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** 007_tickets_registrations.sql — registrations table */
export interface RegistrationRow {
  id: string;
  event_id: string;
  user_id: string;
  ticket_tier_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  status: RegistrationStatus;
  checked_in_at: string | null;
  qr_data: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** 007_tickets_registrations.sql — tickets table */
export interface TicketRow {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  ticket_number: string;
  qr_data: string;
  tier_name: string;
  status: TicketStatus;
  used_at: string | null;
  issued_at: string;
  created_at: string;
  updated_at: string;
}

/** 008_payments.sql — payments table */
export interface PaymentRow {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string | null;
  provider_ref: string | null;
  provider_metadata: Record<string, unknown>;
  paid_at: string | null;
  refunded_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** 008_payments.sql — payouts table */
export interface PayoutRow {
  id: string;
  organizer_id: string;
  event_id: string | null;
  amount: number;
  currency: string;
  status: PayoutStatus;
  provider: string | null;
  provider_ref: string | null;
  bank_account: Record<string, unknown>;
  processed_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** 009_messaging.sql — conversations table */
export interface ConversationRow {
  id: string;
  type: ConversationType;
  event_id: string | null;
  subject: string | null;
  participant_ids: string[];
  last_message_at: string | null;
  last_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** 009_messaging.sql — messages table */
export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  type: MessageType;
  content: string;
  attachments: string[];
  read_by: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** 010_reviews_ratings.sql — reviews table */
export interface ReviewRow {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_approved: boolean;
  is_flagged: boolean;
  flag_reason: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** 011_sponsors.sql — sponsors table */
export interface SponsorRow {
  id: string;
  event_id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  tier: SponsorTier;
  sort_order: number;
  is_active: boolean;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** 012_notifications.sql — notifications table */
export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  reference_type: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** 013_analytics.sql — event_views table */
export interface EventViewRow {
  id: string;
  event_id: string;
  user_id: string | null;
  session_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  referer: string | null;
  country: string | null;
  city: string | null;
  sub_city: string | null;
  device_type: string | null;
  viewed_at: string;
  created_at: string;
}

/** 014_audit_log.sql — audit_log table */
export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: AuditAction;
  target_type: string;
  target_id: string | null;
  target_label: string | null;
  details: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/** 015_promo_codes.sql — promo_codes table */
export interface PromoCodeRow {
  id: string;
  event_id: string | null;
  organizer_id: string | null;
  code: string;
  description: string | null;
  discount_type: PromoDiscountType;
  discount_value: number;
  max_discount: number | null;
  max_uses: number | null;
  used_count: number;
  max_uses_per_user: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  applicable_tiers: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** 018_ai_cache.sql — ai_cache table (service-role only) */
export interface AiCacheRow {
  id: string;
  cache_key: string;
  model_used: string;
  prompt_hash: string;
  response: string;
  tokens_used: number;
  latency_ms: number;
  expires_at: string;
  created_at: string;
}
