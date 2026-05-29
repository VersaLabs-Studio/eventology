// ============================================================================
// @eventology/schemas — Ticket Zod Schemas
// Source: 007_tickets_registrations.sql
// ============================================================================

import { z } from 'zod';
import type { TicketRow } from '../generated/database.types';
import { TICKET_STATUSES } from '../enums';

// ---------------------------------------------------------------------------
// Base schema (matches DB constraints exactly)
// ---------------------------------------------------------------------------

export const ticketSchema = z.object({
  id: z.string().uuid(),
  registration_id: z.string().uuid(),
  event_id: z.string().uuid(),
  user_id: z.string().uuid(),
  ticket_number: z.string().min(1),
  qr_data: z.string().min(1),
  tier_name: z.string().min(1),
  status: z.enum(TICKET_STATUSES),
  used_at: z.string().datetime().nullable(),
  issued_at: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}) satisfies z.ZodType<TicketRow>;

// ---------------------------------------------------------------------------
// Create schema (tickets are system-generated, minimal input)
// ---------------------------------------------------------------------------

export const createTicketSchema = ticketSchema
  .omit({
    id: true,
    ticket_number: true, // Generated server-side
    qr_data: true, // Generated server-side
    status: true, // Defaults to 'valid'
    used_at: true,
    issued_at: true,
    created_at: true,
    updated_at: true,
  });

// ---------------------------------------------------------------------------
// Update schema (only status can change)
// ---------------------------------------------------------------------------

export const updateTicketSchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  used_at: z.string().datetime().nullable().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type TicketFormData = z.infer<typeof createTicketSchema>;
export type TicketUpdateData = z.infer<typeof updateTicketSchema>;

