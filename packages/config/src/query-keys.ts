// ============================================================================
// @eventology/config — Query Key Factory
// ============================================================================
// TanStack Query key factories for every entity.
// Pattern: [EntityName, 'list'|'doc', opts|id]
// ============================================================================

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const ProfileKeys = {
  all: () => ['Profile'] as const,
  list: (opts?: object) => ['Profile', 'list', opts] as const,
  doc: (id: string) => ['Profile', 'doc', id] as const,
};

// ---------------------------------------------------------------------------
// Organizer
// ---------------------------------------------------------------------------

export const OrganizerKeys = {
  all: () => ['Organizer'] as const,
  list: (opts?: object) => ['Organizer', 'list', opts] as const,
  doc: (id: string) => ['Organizer', 'doc', id] as const,
};

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export const CategoryKeys = {
  all: () => ['Category'] as const,
  list: (opts?: object) => ['Category', 'list', opts] as const,
  doc: (id: string) => ['Category', 'doc', id] as const,
};

// ---------------------------------------------------------------------------
// Venue
// ---------------------------------------------------------------------------

export const VenueKeys = {
  all: () => ['Venue'] as const,
  list: (opts?: object) => ['Venue', 'list', opts] as const,
  doc: (id: string) => ['Venue', 'doc', id] as const,
};

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

export const EventKeys = {
  all: () => ['Event'] as const,
  list: (opts?: object) => ['Event', 'list', opts] as const,
  doc: (id: string) => ['Event', 'doc', id] as const,
  bySlug: (slug: string) => ['Event', 'slug', slug] as const,
  featured: () => ['Event', 'featured'] as const,
};

// ---------------------------------------------------------------------------
// TicketTier
// ---------------------------------------------------------------------------

export const TicketTierKeys = {
  all: () => ['TicketTier'] as const,
  list: (opts?: object) => ['TicketTier', 'list', opts] as const,
  doc: (id: string) => ['TicketTier', 'doc', id] as const,
  byEvent: (eventId: string) => ['TicketTier', 'event', eventId] as const,
};

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export const RegistrationKeys = {
  all: () => ['Registration'] as const,
  list: (opts?: object) => ['Registration', 'list', opts] as const,
  doc: (id: string) => ['Registration', 'doc', id] as const,
  byEvent: (eventId: string) => ['Registration', 'event', eventId] as const,
  byUser: (userId: string) => ['Registration', 'user', userId] as const,
};

// ---------------------------------------------------------------------------
// Ticket
// ---------------------------------------------------------------------------

export const TicketKeys = {
  all: () => ['Ticket'] as const,
  list: (opts?: object) => ['Ticket', 'list', opts] as const,
  doc: (id: string) => ['Ticket', 'doc', id] as const,
  byEvent: (eventId: string) => ['Ticket', 'event', eventId] as const,
  byUser: (userId: string) => ['Ticket', 'user', userId] as const,
  byQrData: (qrData: string) => ['Ticket', 'qr', qrData] as const,
};

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export const PaymentKeys = {
  all: () => ['Payment'] as const,
  list: (opts?: object) => ['Payment', 'list', opts] as const,
  doc: (id: string) => ['Payment', 'doc', id] as const,
  byRegistration: (registrationId: string) =>
    ['Payment', 'registration', registrationId] as const,
};

// ---------------------------------------------------------------------------
// Payout
// ---------------------------------------------------------------------------

export const PayoutKeys = {
  all: () => ['Payout'] as const,
  list: (opts?: object) => ['Payout', 'list', opts] as const,
  doc: (id: string) => ['Payout', 'doc', id] as const,
  byOrganizer: (organizerId: string) =>
    ['Payout', 'organizer', organizerId] as const,
};

// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------

export const ConversationKeys = {
  all: () => ['Conversation'] as const,
  list: (opts?: object) => ['Conversation', 'list', opts] as const,
  doc: (id: string) => ['Conversation', 'doc', id] as const,
};

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------

export const MessageKeys = {
  all: () => ['Message'] as const,
  list: (opts?: object) => ['Message', 'list', opts] as const,
  doc: (id: string) => ['Message', 'doc', id] as const,
  byConversation: (conversationId: string) =>
    ['Message', 'conversation', conversationId] as const,
};

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

export const ReviewKeys = {
  all: () => ['Review'] as const,
  list: (opts?: object) => ['Review', 'list', opts] as const,
  doc: (id: string) => ['Review', 'doc', id] as const,
  byEvent: (eventId: string) => ['Review', 'event', eventId] as const,
};

// ---------------------------------------------------------------------------
// Sponsor
// ---------------------------------------------------------------------------

export const SponsorKeys = {
  all: () => ['Sponsor'] as const,
  list: (opts?: object) => ['Sponsor', 'list', opts] as const,
  doc: (id: string) => ['Sponsor', 'doc', id] as const,
  byEvent: (eventId: string) => ['Sponsor', 'event', eventId] as const,
};

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------

export const NotificationKeys = {
  all: () => ['Notification'] as const,
  list: (opts?: object) => ['Notification', 'list', opts] as const,
  doc: (id: string) => ['Notification', 'doc', id] as const,
  byUser: (userId: string) => ['Notification', 'user', userId] as const,
  unreadCount: (userId: string) => ['Notification', 'unread', userId] as const,
};

// ---------------------------------------------------------------------------
// EventView (analytics)
// ---------------------------------------------------------------------------

export const EventViewKeys = {
  all: () => ['EventView'] as const,
  list: (opts?: object) => ['EventView', 'list', opts] as const,
  byEvent: (eventId: string) => ['EventView', 'event', eventId] as const,
};

// ---------------------------------------------------------------------------
// AuditLog
// ---------------------------------------------------------------------------

export const AuditLogKeys = {
  all: () => ['AuditLog'] as const,
  list: (opts?: object) => ['AuditLog', 'list', opts] as const,
  doc: (id: string) => ['AuditLog', 'doc', id] as const,
};

// ---------------------------------------------------------------------------
// PromoCode
// ---------------------------------------------------------------------------

export const PromoCodeKeys = {
  all: () => ['PromoCode'] as const,
  list: (opts?: object) => ['PromoCode', 'list', opts] as const,
  doc: (id: string) => ['PromoCode', 'doc', id] as const,
  byEvent: (eventId: string) => ['PromoCode', 'event', eventId] as const,
  validate: (code: string, eventId: string) =>
    ['PromoCode', 'validate', code, eventId] as const,
};
