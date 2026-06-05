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

// ---------------------------------------------------------------------------
// RPC result type (from create_registration_atomic)
// ---------------------------------------------------------------------------

export interface RegistrationRPCResult {
  success: boolean;
  error?: string;
  message?: string;
  registration?: {
    id: string;
    event_id: string;
    user_id: string;
    ticket_tier_id: string;
    attendee_name: string;
    attendee_email: string;
    attendee_phone: string | null;
    status: string;
    created_at: string;
  };
  // ticket is always null from the RPC — issuance is handled app-side via issueTicket()
  ticket?: {
    id: string;
    ticket_number: string;
    qr_data: string;
    tier_name: string;
    status: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type RegistrationFormData = z.infer<typeof createRegistrationSchema>;
export type RegistrationUpdateData = z.infer<typeof updateRegistrationSchema>;

