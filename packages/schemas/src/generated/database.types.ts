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
export type OrganizerFollowRow = Tables<'organizer_follows'>;
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
export type SavedEventRow = Tables<'saved_events'>;
export type SponsorRow = Tables<'sponsors'>;
export type NotificationRow = Tables<'notifications'>;
export type NotificationDeliveryRow = Tables<'notification_deliveries'>;
export type NotificationPreferencesRow = Tables<'notification_preferences'>;
export type PushTokenRow = Tables<'push_tokens'>;
export type PromoRedemptionRow = Tables<'promo_redemptions'>;
export type EventViewRow = Tables<'event_views'>;
export type AuditLogRow = Tables<'audit_log'>;
export type PromoCodeRow = Tables<'promo_codes'>;
export type AiCacheRow = Tables<'ai_cache'>;

// ---------------------------------------------------------------------------
// V2.0 Row type aliases (EPIC 1–3: social, engagement, ticketing) — 038..046
// ---------------------------------------------------------------------------

export type UserFollowRow = Tables<'user_follows'>;
export type FeedActivityRow = Tables<'feed_activities'>;
export type EventQuestionRow = Tables<'event_questions'>;
export type EventAnswerRow = Tables<'event_answers'>;
export type EventQuestionVoteRow = Tables<'event_question_votes'>;
export type CollectionRow = Tables<'collections'>;
export type CollectionItemRow = Tables<'collection_items'>;
export type BadgeRow = Tables<'badges'>;
export type UserBadgeRow = Tables<'user_badges'>;
export type PointLedgerRow = Tables<'point_ledger'>;
export type ReferralRow = Tables<'referrals'>;
export type ReferralRedemptionRow = Tables<'referral_redemptions'>;
export type EventMediaRow = Tables<'event_media'>;
export type EventMediaReactionRow = Tables<'event_media_reactions'>;
export type TicketTransferRow = Tables<'ticket_transfers'>;
export type WalletPassRow = Tables<'wallet_passes'>;
export type EventFormFieldRow = Tables<'event_form_fields'>;
export type RegistrationAnswerRow = Tables<'registration_answers'>;

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
export type NotificationChannel = Enums<'notification_channel'>;
export type AuditAction = Enums<'audit_action'>;
export type PromoDiscountType = Enums<'promo_discount_type'>;
export type SponsorTier = Enums<'sponsor_tier'>;
export type SectionType = Enums<'section_type'>;
export type SeatStatus = Enums<'seat_status'>;
export type VerificationStatus = Enums<'verification_status'>;
export type FeaturedDuration = Enums<'featured_duration'>;

// ---------------------------------------------------------------------------
// V2.0 Enum type aliases — 038..046
// ---------------------------------------------------------------------------

export type FeedVerb = Enums<'feed_verb'>;
export type CollectionVisibility = Enums<'collection_visibility'>;
export type MediaStatus = Enums<'media_status'>;
export type TransferStatus = Enums<'transfer_status'>;
export type ReferralStatus = Enums<'referral_status'>;
export type FormFieldType = Enums<'form_field_type'>;
