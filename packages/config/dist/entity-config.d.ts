export declare const ENTITY_CONFIG: {
    readonly profiles: {
        readonly table: "profiles";
        readonly label: "Profile";
        readonly labelPlural: "Profiles";
        readonly searchFields: readonly ["full_name", "email"];
        readonly labelField: "full_name";
        readonly sortField: "created_at";
        readonly sortOrder: "desc";
        readonly publicPath: "/api/public/profiles";
        readonly protectedPath: "/api/protected/profiles";
    };
    readonly organizers: {
        readonly table: "organizers";
        readonly label: "Organizer";
        readonly labelPlural: "Organizers";
        readonly searchFields: readonly ["name", "email", "bio"];
        readonly labelField: "name";
        readonly sortField: "created_at";
        readonly sortOrder: "desc";
        readonly publicPath: "/api/public/organizers";
        readonly protectedPath: "/api/protected/organizers";
    };
    readonly categories: {
        readonly table: "categories";
        readonly label: "Category";
        readonly labelPlural: "Categories";
        readonly searchFields: readonly ["name", "description"];
        readonly labelField: "name";
        readonly sortField: "sort_order";
        readonly sortOrder: "asc";
        readonly publicPath: "/api/public/categories";
        readonly protectedPath: "/api/protected/categories";
    };
    readonly venues: {
        readonly table: "venues";
        readonly label: "Venue";
        readonly labelPlural: "Venues";
        readonly searchFields: readonly ["name", "address", "sub_city"];
        readonly labelField: "name";
        readonly sortField: "created_at";
        readonly sortOrder: "desc";
        readonly publicPath: "/api/public/venues";
        readonly protectedPath: "/api/protected/venues";
    };
    readonly events: {
        readonly table: "events";
        readonly label: "Event";
        readonly labelPlural: "Events";
        readonly searchFields: readonly ["title", "description", "short_description", "venue_name", "venue_address"];
        readonly labelField: "title";
        readonly sortField: "created_at";
        readonly sortOrder: "desc";
        readonly publicPath: "/api/public/events";
        readonly protectedPath: "/api/protected/events";
    };
    readonly ticket_tiers: {
        readonly table: "ticket_tiers";
        readonly label: "Ticket Tier";
        readonly labelPlural: "Ticket Tiers";
        readonly searchFields: readonly ["name", "description"];
        readonly labelField: "name";
        readonly sortField: "sort_order";
        readonly sortOrder: "asc";
        readonly publicPath: "/api/public/ticket-tiers";
        readonly protectedPath: "/api/protected/ticket-tiers";
    };
    readonly registrations: {
        readonly table: "registrations";
        readonly label: "Registration";
        readonly labelPlural: "Registrations";
        readonly searchFields: readonly ["attendee_name", "attendee_email"];
        readonly labelField: "attendee_name";
        readonly sortField: "created_at";
        readonly sortOrder: "desc";
        readonly publicPath: null;
        readonly protectedPath: "/api/protected/registrations";
    };
    readonly tickets: {
        readonly table: "tickets";
        readonly label: "Ticket";
        readonly labelPlural: "Tickets";
        readonly searchFields: readonly ["ticket_number", "tier_name"];
        readonly labelField: "ticket_number";
        readonly sortField: "issued_at";
        readonly sortOrder: "desc";
        readonly publicPath: null;
        readonly protectedPath: "/api/protected/tickets";
    };
    readonly payments: {
        readonly table: "payments";
        readonly label: "Payment";
        readonly labelPlural: "Payments";
        readonly searchFields: readonly ["notes"];
        readonly labelField: "id";
        readonly sortField: "created_at";
        readonly sortOrder: "desc";
        readonly publicPath: null;
        readonly protectedPath: "/api/protected/payments";
    };
    readonly payouts: {
        readonly table: "payouts";
        readonly label: "Payout";
        readonly labelPlural: "Payouts";
        readonly searchFields: readonly ["notes"];
        readonly labelField: "id";
        readonly sortField: "created_at";
        readonly sortOrder: "desc";
        readonly publicPath: null;
        readonly protectedPath: "/api/protected/payouts";
    };
    readonly conversations: {
        readonly table: "conversations";
        readonly label: "Conversation";
        readonly labelPlural: "Conversations";
        readonly searchFields: readonly ["subject"];
        readonly labelField: "subject";
        readonly sortField: "last_message_at";
        readonly sortOrder: "desc";
        readonly publicPath: null;
        readonly protectedPath: "/api/protected/conversations";
    };
    readonly messages: {
        readonly table: "messages";
        readonly label: "Message";
        readonly labelPlural: "Messages";
        readonly searchFields: readonly ["content"];
        readonly labelField: "content";
        readonly sortField: "created_at";
        readonly sortOrder: "asc";
        readonly publicPath: null;
        readonly protectedPath: "/api/protected/messages";
    };
    readonly reviews: {
        readonly table: "reviews";
        readonly label: "Review";
        readonly labelPlural: "Reviews";
        readonly searchFields: readonly ["title", "content"];
        readonly labelField: "title";
        readonly sortField: "created_at";
        readonly sortOrder: "desc";
        readonly publicPath: "/api/public/reviews";
        readonly protectedPath: "/api/protected/reviews";
    };
    readonly sponsors: {
        readonly table: "sponsors";
        readonly label: "Sponsor";
        readonly labelPlural: "Sponsors";
        readonly searchFields: readonly ["name", "description"];
        readonly labelField: "name";
        readonly sortField: "sort_order";
        readonly sortOrder: "asc";
        readonly publicPath: "/api/public/sponsors";
        readonly protectedPath: "/api/protected/sponsors";
    };
    readonly notifications: {
        readonly table: "notifications";
        readonly label: "Notification";
        readonly labelPlural: "Notifications";
        readonly searchFields: readonly ["title", "message"];
        readonly labelField: "title";
        readonly sortField: "created_at";
        readonly sortOrder: "desc";
        readonly publicPath: null;
        readonly protectedPath: "/api/protected/notifications";
    };
    readonly event_views: {
        readonly table: "event_views";
        readonly label: "Event View";
        readonly labelPlural: "Event Views";
        readonly searchFields: readonly [];
        readonly labelField: "id";
        readonly sortField: "viewed_at";
        readonly sortOrder: "desc";
        readonly publicPath: null;
        readonly protectedPath: "/api/protected/event-views";
    };
    readonly audit_log: {
        readonly table: "audit_log";
        readonly label: "Audit Log";
        readonly labelPlural: "Audit Log";
        readonly searchFields: readonly ["target_label", "details"];
        readonly labelField: "target_label";
        readonly sortField: "created_at";
        readonly sortOrder: "desc";
        readonly publicPath: null;
        readonly protectedPath: "/api/protected/audit-log";
    };
    readonly promo_codes: {
        readonly table: "promo_codes";
        readonly label: "Promo Code";
        readonly labelPlural: "Promo Codes";
        readonly searchFields: readonly ["code", "description"];
        readonly labelField: "code";
        readonly sortField: "created_at";
        readonly sortOrder: "desc";
        readonly publicPath: null;
        readonly protectedPath: "/api/protected/promo-codes";
    };
};
export type EntityKey = keyof typeof ENTITY_CONFIG;
//# sourceMappingURL=entity-config.d.ts.map