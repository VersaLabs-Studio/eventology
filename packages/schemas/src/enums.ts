// ============================================================================
// @eventology/schemas — Enum Constants
// ============================================================================
// Runtime enum value arrays derived from 002_enums.sql.
// Use these for Zod .enum() schemas, select options, and iteration.
// ============================================================================

import type {
  UserRole,
  EventStatus,
  EventType,
  TicketType,
  RegistrationStatus,
  TicketStatus,
  PaymentStatus,
  PaymentMethod,
  PayoutStatus,
  ConversationType,
  MessageType,
  NotificationType,
  NotificationChannel,
  AuditAction,
  PromoDiscountType,
  SponsorTier,
  SectionType,
  SeatStatus,
  VerificationStatus,
  FeaturedDuration,
} from './generated/database.types';

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export const USER_ROLES: readonly UserRole[] = ['attendee', 'organizer', 'admin'] as const;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const EVENT_STATUSES: readonly EventStatus[] = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'cancelled',
] as const;

export const EVENT_TYPES: readonly EventType[] = [
  'conference',
  'workshop',
  'meetup',
  'seminar',
  'networking',
  'concert',
  'exhibition',
  'training',
] as const;

export const TICKET_TYPES: readonly TicketType[] = ['free', 'paid'] as const;

// ---------------------------------------------------------------------------
// Registrations & Tickets
// ---------------------------------------------------------------------------

export const REGISTRATION_STATUSES: readonly RegistrationStatus[] = [
  'confirmed',
  'cancelled',
  'checked_in',
  'waitlisted',
  'pending_payment',
] as const;

export const TICKET_STATUSES: readonly TicketStatus[] = ['valid', 'used', 'cancelled'] as const;

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'pending',
  'completed',
  'failed',
  'refunded',
] as const;

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  'pay_at_door',
  'chapa',
  'telebirr',
  'bank_transfer',
] as const;

export const PAYOUT_STATUSES: readonly PayoutStatus[] = [
  'pending',
  'processing',
  'completed',
  'failed',
] as const;

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

export const CONVERSATION_TYPES: readonly ConversationType[] = [
  'direct',
  'event_inquiry',
  'support',
] as const;

export const MESSAGE_TYPES: readonly MessageType[] = ['text', 'image', 'system'] as const;

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'registration_confirmed',
  'event_reminder',
  'event_cancelled',
  'event_approved',
  'event_rejected',
  'new_registration',
  'payment_received',
  'message_received',
  'system_announcement',
  'payment_completed',
  'refund_processed',
  'payout_update',
] as const;

export const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = [
  'email',
  'sms',
  'push',
] as const;

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export const AUDIT_ACTIONS: readonly AuditAction[] = [
  'event_approved',
  'event_rejected',
  'event_featured',
  'event_unfeatured',
  'organizer_verified',
  'organizer_rejected',
  'user_role_changed',
  'user_deactivated',
  'user_activated',
  'registration_created',
  'payment_completed',
  'system_config_changed',
] as const;

// ---------------------------------------------------------------------------
// Promo Codes
// ---------------------------------------------------------------------------

export const PROMO_DISCOUNT_TYPES: readonly PromoDiscountType[] = [
  'percentage',
  'fixed',
] as const;

// ---------------------------------------------------------------------------
// Sponsors
// ---------------------------------------------------------------------------

export const SPONSOR_TIERS: readonly SponsorTier[] = [
  'platinum',
  'gold',
  'silver',
  'bronze',
] as const;

// ---------------------------------------------------------------------------
// Seating
// ---------------------------------------------------------------------------

export const SECTION_TYPES: readonly SectionType[] = [
  'general',
  'vip',
  'stage',
  'standing',
  'accessible',
] as const;

export const SEAT_STATUSES: readonly SeatStatus[] = [
  'available',
  'reserved',
  'sold',
  'blocked',
] as const;

// ---------------------------------------------------------------------------
// Verification & Featuring
// ---------------------------------------------------------------------------

export const VERIFICATION_STATUSES: readonly VerificationStatus[] = [
  'pending',
  'verified',
  'rejected',
] as const;

export const FEATURED_DURATIONS: readonly FeaturedDuration[] = [
  '7_days',
  '14_days',
  '30_days',
] as const;
