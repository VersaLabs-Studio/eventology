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
    all: () => ['Profile'],
    list: (opts) => ['Profile', 'list', opts],
    doc: (id) => ['Profile', 'doc', id],
};
// ---------------------------------------------------------------------------
// Organizer
// ---------------------------------------------------------------------------
export const OrganizerKeys = {
    all: () => ['Organizer'],
    list: (opts) => ['Organizer', 'list', opts],
    doc: (id) => ['Organizer', 'doc', id],
};
// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------
export const CategoryKeys = {
    all: () => ['Category'],
    list: (opts) => ['Category', 'list', opts],
    doc: (id) => ['Category', 'doc', id],
};
// ---------------------------------------------------------------------------
// Venue
// ---------------------------------------------------------------------------
export const VenueKeys = {
    all: () => ['Venue'],
    list: (opts) => ['Venue', 'list', opts],
    doc: (id) => ['Venue', 'doc', id],
};
// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------
export const EventKeys = {
    all: () => ['Event'],
    list: (opts) => ['Event', 'list', opts],
    doc: (id) => ['Event', 'doc', id],
    bySlug: (slug) => ['Event', 'slug', slug],
    featured: () => ['Event', 'featured'],
};
// ---------------------------------------------------------------------------
// TicketTier
// ---------------------------------------------------------------------------
export const TicketTierKeys = {
    all: () => ['TicketTier'],
    list: (opts) => ['TicketTier', 'list', opts],
    doc: (id) => ['TicketTier', 'doc', id],
    byEvent: (eventId) => ['TicketTier', 'event', eventId],
};
// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
export const RegistrationKeys = {
    all: () => ['Registration'],
    list: (opts) => ['Registration', 'list', opts],
    doc: (id) => ['Registration', 'doc', id],
    byEvent: (eventId) => ['Registration', 'event', eventId],
    byUser: (userId) => ['Registration', 'user', userId],
};
// ---------------------------------------------------------------------------
// Ticket
// ---------------------------------------------------------------------------
export const TicketKeys = {
    all: () => ['Ticket'],
    list: (opts) => ['Ticket', 'list', opts],
    doc: (id) => ['Ticket', 'doc', id],
    byEvent: (eventId) => ['Ticket', 'event', eventId],
    byUser: (userId) => ['Ticket', 'user', userId],
    byQrData: (qrData) => ['Ticket', 'qr', qrData],
};
// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------
export const PaymentKeys = {
    all: () => ['Payment'],
    list: (opts) => ['Payment', 'list', opts],
    doc: (id) => ['Payment', 'doc', id],
    byRegistration: (registrationId) => ['Payment', 'registration', registrationId],
};
// ---------------------------------------------------------------------------
// Payout
// ---------------------------------------------------------------------------
export const PayoutKeys = {
    all: () => ['Payout'],
    list: (opts) => ['Payout', 'list', opts],
    doc: (id) => ['Payout', 'doc', id],
    byOrganizer: (organizerId) => ['Payout', 'organizer', organizerId],
};
// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------
export const ConversationKeys = {
    all: () => ['Conversation'],
    list: (opts) => ['Conversation', 'list', opts],
    doc: (id) => ['Conversation', 'doc', id],
};
// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------
export const MessageKeys = {
    all: () => ['Message'],
    list: (opts) => ['Message', 'list', opts],
    doc: (id) => ['Message', 'doc', id],
    byConversation: (conversationId) => ['Message', 'conversation', conversationId],
};
// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------
export const ReviewKeys = {
    all: () => ['Review'],
    list: (opts) => ['Review', 'list', opts],
    doc: (id) => ['Review', 'doc', id],
    byEvent: (eventId) => ['Review', 'event', eventId],
};
// ---------------------------------------------------------------------------
// Sponsor
// ---------------------------------------------------------------------------
export const SponsorKeys = {
    all: () => ['Sponsor'],
    list: (opts) => ['Sponsor', 'list', opts],
    doc: (id) => ['Sponsor', 'doc', id],
    byEvent: (eventId) => ['Sponsor', 'event', eventId],
};
// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------
export const NotificationKeys = {
    all: () => ['Notification'],
    list: (opts) => ['Notification', 'list', opts],
    doc: (id) => ['Notification', 'doc', id],
    byUser: (userId) => ['Notification', 'user', userId],
    unreadCount: (userId) => ['Notification', 'unread', userId],
};
// ---------------------------------------------------------------------------
// EventView (analytics)
// ---------------------------------------------------------------------------
export const EventViewKeys = {
    all: () => ['EventView'],
    list: (opts) => ['EventView', 'list', opts],
    byEvent: (eventId) => ['EventView', 'event', eventId],
};
// ---------------------------------------------------------------------------
// AuditLog
// ---------------------------------------------------------------------------
export const AuditLogKeys = {
    all: () => ['AuditLog'],
    list: (opts) => ['AuditLog', 'list', opts],
    doc: (id) => ['AuditLog', 'doc', id],
};
// ---------------------------------------------------------------------------
// PromoCode
// ---------------------------------------------------------------------------
export const PromoCodeKeys = {
    all: () => ['PromoCode'],
    list: (opts) => ['PromoCode', 'list', opts],
    doc: (id) => ['PromoCode', 'doc', id],
    byEvent: (eventId) => ['PromoCode', 'event', eventId],
    validate: (code, eventId) => ['PromoCode', 'validate', code, eventId],
};
//# sourceMappingURL=query-keys.js.map