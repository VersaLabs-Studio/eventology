// ============================================================================
// @eventology/schemas — Registration Zod Schemas
// Source: 007_tickets_registrations.sql
// ============================================================================
import { z } from 'zod';
import { REGISTRATION_STATUSES } from '../enums';
// ---------------------------------------------------------------------------
// Base schema (matches DB constraints exactly)
// ---------------------------------------------------------------------------
export const registrationSchema = z.object({
    id: z.string().uuid(),
    event_id: z.string().uuid(),
    user_id: z.string().uuid(),
    ticket_tier_id: z.string().uuid(),
    attendee_name: z.string().min(1, 'Attendee name is required'),
    attendee_email: z.string().email(),
    attendee_phone: z.string().nullable(),
    status: z.enum(REGISTRATION_STATUSES),
    checked_in_at: z.string().datetime().nullable(),
    qr_data: z.string().min(1),
    metadata: z.record(z.string(), z.unknown()).default({}),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
// ---------------------------------------------------------------------------
// Create schema
// ---------------------------------------------------------------------------
export const createRegistrationSchema = registrationSchema
    .omit({
    id: true,
    status: true, // Defaults to 'confirmed' via DB
    checked_in_at: true,
    qr_data: true, // Generated server-side
    created_at: true,
    updated_at: true,
})
    .extend({
    metadata: z.record(z.string(), z.unknown()).default({}),
});
// ---------------------------------------------------------------------------
// Update schema
// ---------------------------------------------------------------------------
export const updateRegistrationSchema = createRegistrationSchema.partial();
//# sourceMappingURL=registration.js.map