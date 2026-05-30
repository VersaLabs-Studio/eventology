// ============================================================================
// @eventology/schemas — TicketTier Zod Schemas
// Source: 007_tickets_registrations.sql
// ============================================================================
import { z } from 'zod';
// ---------------------------------------------------------------------------
// Base schema (matches DB constraints exactly)
// ---------------------------------------------------------------------------
export const ticketTierSchema = z.object({
    id: z.string().uuid(),
    event_id: z.string().uuid(),
    name: z.string().min(1, 'Tier name is required').max(255),
    description: z.string().max(1000).nullable(),
    price: z.number().min(0),
    currency: z.string().min(3).max(3).default('ETB'),
    capacity: z.number().int().min(0),
    sold_count: z.number().int().min(0),
    sort_order: z.number().int(),
    is_active: z.boolean(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
// ---------------------------------------------------------------------------
// Create schema
// ---------------------------------------------------------------------------
export const createTicketTierSchema = ticketTierSchema
    .omit({
    id: true,
    sold_count: true,
    created_at: true,
    updated_at: true,
})
    .extend({
    currency: z.string().min(3).max(3).default('ETB'),
    capacity: z.number().int().min(0).default(0),
    sort_order: z.number().int().default(0),
    is_active: z.boolean().default(true),
});
// ---------------------------------------------------------------------------
// Update schema
// ---------------------------------------------------------------------------
export const updateTicketTierSchema = createTicketTierSchema.partial();
//# sourceMappingURL=ticket-tier.js.map