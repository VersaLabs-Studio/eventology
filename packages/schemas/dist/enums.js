// ============================================================================
// @eventology/schemas — Enum Constants
// ============================================================================
// Runtime enum value arrays derived from 002_enums.sql.
// Use these for Zod .enum() schemas, select options, and iteration.
// ============================================================================
// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------
export const USER_ROLES = ['attendee', 'organizer', 'admin'];
// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export const EVENT_STATUSES = [
    'draft',
    'pending',
    'approved',
    'rejected',
    'cancelled',
];
export const EVENT_TYPES = [
    'conference',
    'workshop',
    'meetup',
    'seminar',
    'networking',
    'concert',
    'exhibition',
    'training',
];
export const TICKET_TYPES = ['free', 'paid'];
// ---------------------------------------------------------------------------
// Registrations & Tickets
// ---------------------------------------------------------------------------
export const REGISTRATION_STATUSES = [
    'confirmed',
    'cancelled',
    'checked_in',
    'waitlisted',
];
export const TICKET_STATUSES = ['valid', 'used', 'cancelled'];
// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
export const PAYMENT_STATUSES = [
    'pending',
    'completed',
    'failed',
    'refunded',
];
export const PAYMENT_METHODS = [
    'pay_at_door',
    'chapa',
    'telebirr',
    'bank_transfer',
];
export const PAYOUT_STATUSES = [
    'pending',
    'processing',
    'completed',
    'failed',
];
// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------
export const CONVERSATION_TYPES = [
    'direct',
    'event_inquiry',
    'support',
];
export const MESSAGE_TYPES = ['text', 'image', 'system'];
// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export const NOTIFICATION_TYPES = [
    'registration_confirmed',
    'event_reminder',
    'event_cancelled',
    'event_approved',
    'event_rejected',
    'new_registration',
    'payment_received',
    'message_received',
    'system_announcement',
];
// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------
export const AUDIT_ACTIONS = [
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
];
// ---------------------------------------------------------------------------
// Promo Codes
// ---------------------------------------------------------------------------
export const PROMO_DISCOUNT_TYPES = [
    'percentage',
    'fixed',
];
// ---------------------------------------------------------------------------
// Sponsors
// ---------------------------------------------------------------------------
export const SPONSOR_TIERS = [
    'platinum',
    'gold',
    'silver',
    'bronze',
];
// ---------------------------------------------------------------------------
// Seating
// ---------------------------------------------------------------------------
export const SECTION_TYPES = [
    'general',
    'vip',
    'stage',
    'standing',
    'accessible',
];
export const SEAT_STATUSES = [
    'available',
    'reserved',
    'sold',
    'blocked',
];
// ---------------------------------------------------------------------------
// Verification & Featuring
// ---------------------------------------------------------------------------
export const VERIFICATION_STATUSES = [
    'pending',
    'verified',
    'rejected',
];
export const FEATURED_DURATIONS = [
    '7_days',
    '14_days',
    '30_days',
];
//# sourceMappingURL=enums.js.map