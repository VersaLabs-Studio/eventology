// ============================================================================
// @eventology/schemas — Database Type Aliases
// ============================================================================
// Re-exports from the generated Supabase types (database.types.ts) for
// backward compatibility with entity schemas that import *Row types.
//
// Source of truth: `npx supabase gen types typescript --linked`
// Run that command to refresh ../database.types.ts, then this file's
// type aliases stay in sync automatically.
// ============================================================================

import type { Tables, TablesInsert, TablesUpdate, Enums } from '../database.types';

// Re-export helpers so consumers can import from either path
export type { Tables, TablesInsert, TablesUpdate, Enums };

// ---------------------------------------------------------------------------
// Row type aliases (derived from generated types)
// ---------------------------------------------------------------------------

export type ProfileRow = Tables<'profiles'>;
export type OrganizerRow = Tables<'organizers'>;
export type OrganizerTeamMemberRow = Tables<'organizer_team_members'>;
export type CategoryRow = Tables<'categories'>;
export type VenueRow = Tables<'venues'>;
export type EventRow = Tables<'events'>;
export type TicketTierRow = Tables<'ticket_tiers'>;
export type RegistrationRow = Tables<'registrations'>;
export type TicketRow = Tables<'tickets'>;
export type PaymentRow = Tables<'payments'>;
export type PayoutRow = Tables<'payouts'>;
export type ConversationRow = Tables<'conversations'>;
export type MessageRow = Tables<'messages'>;
export type ReviewRow = Tables<'reviews'>;
export type SponsorRow = Tables<'sponsors'>;
export type NotificationRow = Tables<'notifications'>;
export type EventViewRow = Tables<'event_views'>;
export type AuditLogRow = Tables<'audit_log'>;
export type PromoCodeRow = Tables<'promo_codes'>;
export type AiCacheRow = Tables<'ai_cache'>;

// ---------------------------------------------------------------------------
// Enum type aliases (derived from generated types)
// ---------------------------------------------------------------------------

export type UserRole = Enums<'user_role'>;
export type EventStatus = Enums<'event_status'>;
export type EventType = Enums<'event_type'>;
export type TicketType = Enums<'ticket_type'>;
export type RegistrationStatus = Enums<'registration_status'>;
export type TicketStatus = Enums<'ticket_status'>;
export type PaymentStatus = Enums<'payment_status'>;
export type PaymentMethod = Enums<'payment_method'>;
export type PayoutStatus = Enums<'payout_status'>;
export type ConversationType = Enums<'conversation_type'>;
export type MessageType = Enums<'message_type'>;
export type NotificationType = Enums<'notification_type'>;
export type AuditAction = Enums<'audit_action'>;
export type PromoDiscountType = Enums<'promo_discount_type'>;
export type SponsorTier = Enums<'sponsor_tier'>;
export type SectionType = Enums<'section_type'>;
export type SeatStatus = Enums<'seat_status'>;
export type VerificationStatus = Enums<'verification_status'>;
export type FeaturedDuration = Enums<'featured_duration'>;
