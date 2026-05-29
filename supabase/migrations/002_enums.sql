-- ============================================================================
-- Migration 002: Enum Types
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Defines all custom PostgreSQL enum types used across the platform.
-- These enums enforce data integrity at the database level and map directly
-- to TypeScript union types in the application layer.
-- ============================================================================

-- User roles: attendee (default), organizer (verified), admin (platform staff)
CREATE TYPE public.user_role AS ENUM ('attendee', 'organizer', 'admin');

-- Event lifecycle status
CREATE TYPE public.event_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'cancelled');

-- Event category types
CREATE TYPE public.event_type AS ENUM (
  'conference', 'workshop', 'meetup', 'seminar',
  'networking', 'concert', 'exhibition', 'training'
);

-- Ticket pricing model
CREATE TYPE public.ticket_type AS ENUM ('free', 'paid');

-- Registration lifecycle
CREATE TYPE public.registration_status AS ENUM ('confirmed', 'cancelled', 'checked_in', 'waitlisted');

-- Ticket validity state
CREATE TYPE public.ticket_status AS ENUM ('valid', 'used', 'cancelled');

-- Payment lifecycle
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Payment method options (V1: pay-at-door, V2: online gateways)
CREATE TYPE public.payment_method AS ENUM ('pay_at_door', 'chapa', 'telebirr', 'bank_transfer');

-- Payout lifecycle for organizer disbursements
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Conversation context type
CREATE TYPE public.conversation_type AS ENUM ('direct', 'event_inquiry', 'support');

-- Message content type
CREATE TYPE public.message_type AS ENUM ('text', 'image', 'system');

-- Notification category
CREATE TYPE public.notification_type AS ENUM (
  'registration_confirmed', 'event_reminder', 'event_cancelled',
  'event_approved', 'event_rejected', 'new_registration',
  'payment_received', 'message_received', 'system_announcement'
);

-- Audit log action categories
CREATE TYPE public.audit_action AS ENUM (
  'event_approved', 'event_rejected', 'event_featured', 'event_unfeatured',
  'organizer_verified', 'organizer_rejected', 'user_role_changed',
  'user_deactivated', 'user_activated', 'registration_created',
  'payment_completed', 'system_config_changed'
);

-- Promo code discount type
CREATE TYPE public.promo_discount_type AS ENUM ('percentage', 'fixed');

-- Sponsor tier level
CREATE TYPE public.sponsor_tier AS ENUM ('platinum', 'gold', 'silver', 'bronze');

-- Seat map section types
CREATE TYPE public.section_type AS ENUM ('general', 'vip', 'stage', 'standing', 'accessible');

-- Seat availability status
CREATE TYPE public.seat_status AS ENUM ('available', 'reserved', 'sold', 'blocked');

-- Organizer verification status
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Featured event duration options
CREATE TYPE public.featured_duration AS ENUM ('7_days', '14_days', '30_days');
