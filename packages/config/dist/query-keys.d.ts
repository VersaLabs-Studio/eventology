export declare const ProfileKeys: {
    all: () => readonly ["Profile"];
    list: (opts?: object) => readonly ["Profile", "list", object | undefined];
    doc: (id: string) => readonly ["Profile", "doc", string];
};
export declare const OrganizerKeys: {
    all: () => readonly ["Organizer"];
    list: (opts?: object) => readonly ["Organizer", "list", object | undefined];
    doc: (id: string) => readonly ["Organizer", "doc", string];
};
export declare const CategoryKeys: {
    all: () => readonly ["Category"];
    list: (opts?: object) => readonly ["Category", "list", object | undefined];
    doc: (id: string) => readonly ["Category", "doc", string];
};
export declare const VenueKeys: {
    all: () => readonly ["Venue"];
    list: (opts?: object) => readonly ["Venue", "list", object | undefined];
    doc: (id: string) => readonly ["Venue", "doc", string];
};
export declare const EventKeys: {
    all: () => readonly ["Event"];
    list: (opts?: object) => readonly ["Event", "list", object | undefined];
    doc: (id: string) => readonly ["Event", "doc", string];
    bySlug: (slug: string) => readonly ["Event", "slug", string];
    featured: () => readonly ["Event", "featured"];
};
export declare const TicketTierKeys: {
    all: () => readonly ["TicketTier"];
    list: (opts?: object) => readonly ["TicketTier", "list", object | undefined];
    doc: (id: string) => readonly ["TicketTier", "doc", string];
    byEvent: (eventId: string) => readonly ["TicketTier", "event", string];
};
export declare const RegistrationKeys: {
    all: () => readonly ["Registration"];
    list: (opts?: object) => readonly ["Registration", "list", object | undefined];
    doc: (id: string) => readonly ["Registration", "doc", string];
    byEvent: (eventId: string) => readonly ["Registration", "event", string];
    byUser: (userId: string) => readonly ["Registration", "user", string];
};
export declare const TicketKeys: {
    all: () => readonly ["Ticket"];
    list: (opts?: object) => readonly ["Ticket", "list", object | undefined];
    doc: (id: string) => readonly ["Ticket", "doc", string];
    byEvent: (eventId: string) => readonly ["Ticket", "event", string];
    byUser: (userId: string) => readonly ["Ticket", "user", string];
    byQrData: (qrData: string) => readonly ["Ticket", "qr", string];
};
export declare const PaymentKeys: {
    all: () => readonly ["Payment"];
    list: (opts?: object) => readonly ["Payment", "list", object | undefined];
    doc: (id: string) => readonly ["Payment", "doc", string];
    byRegistration: (registrationId: string) => readonly ["Payment", "registration", string];
};
export declare const PayoutKeys: {
    all: () => readonly ["Payout"];
    list: (opts?: object) => readonly ["Payout", "list", object | undefined];
    doc: (id: string) => readonly ["Payout", "doc", string];
    byOrganizer: (organizerId: string) => readonly ["Payout", "organizer", string];
};
export declare const ConversationKeys: {
    all: () => readonly ["Conversation"];
    list: (opts?: object) => readonly ["Conversation", "list", object | undefined];
    doc: (id: string) => readonly ["Conversation", "doc", string];
};
export declare const MessageKeys: {
    all: () => readonly ["Message"];
    list: (opts?: object) => readonly ["Message", "list", object | undefined];
    doc: (id: string) => readonly ["Message", "doc", string];
    byConversation: (conversationId: string) => readonly ["Message", "conversation", string];
};
export declare const ReviewKeys: {
    all: () => readonly ["Review"];
    list: (opts?: object) => readonly ["Review", "list", object | undefined];
    doc: (id: string) => readonly ["Review", "doc", string];
    byEvent: (eventId: string) => readonly ["Review", "event", string];
};
export declare const SponsorKeys: {
    all: () => readonly ["Sponsor"];
    list: (opts?: object) => readonly ["Sponsor", "list", object | undefined];
    doc: (id: string) => readonly ["Sponsor", "doc", string];
    byEvent: (eventId: string) => readonly ["Sponsor", "event", string];
};
export declare const NotificationKeys: {
    all: () => readonly ["Notification"];
    list: (opts?: object) => readonly ["Notification", "list", object | undefined];
    doc: (id: string) => readonly ["Notification", "doc", string];
    byUser: (userId: string) => readonly ["Notification", "user", string];
    unreadCount: (userId: string) => readonly ["Notification", "unread", string];
};
export declare const EventViewKeys: {
    all: () => readonly ["EventView"];
    list: (opts?: object) => readonly ["EventView", "list", object | undefined];
    byEvent: (eventId: string) => readonly ["EventView", "event", string];
};
export declare const AuditLogKeys: {
    all: () => readonly ["AuditLog"];
    list: (opts?: object) => readonly ["AuditLog", "list", object | undefined];
    doc: (id: string) => readonly ["AuditLog", "doc", string];
};
export declare const PromoCodeKeys: {
    all: () => readonly ["PromoCode"];
    list: (opts?: object) => readonly ["PromoCode", "list", object | undefined];
    doc: (id: string) => readonly ["PromoCode", "doc", string];
    byEvent: (eventId: string) => readonly ["PromoCode", "event", string];
    validate: (code: string, eventId: string) => readonly ["PromoCode", "validate", string, string];
};
//# sourceMappingURL=query-keys.d.ts.map