// ============================================================================
// @eventology/schemas — Ticket Transfer Zod Schemas
// Source: 044_ticket_transfers.sql
// ============================================================================
// Transfers are SECURITY DEFINER writes — no client insert path exists.
// QR payloads are pre-signed by the route via the server util (the HMAC
// secret never enters the DB), and the fn verifies the expected version
// under lock.
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

export const transferStatusSchema = z.enum(['pending', 'completed', 'cancelled']);
export const transferKindSchema = z.enum(['transfer', 'resale']);

// Full row shape (mirrors the generated `TicketTransferRow` from database.types.ts).
export const ticketTransferSchema = z.object({
  id: pgUuid(),
  ticket_id: pgUuid(),
  from_profile: pgUuid(),
  to_profile: pgUuid().nullable(),
  to_email: z.string().email(),
  kind: transferKindSchema,
  status: transferStatusSchema,
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
});

// Transfer/resale payload (route: POST /api/protected/tickets/[id]/transfer).
export const transferTicketSchema = z.object({
  to_email: z.string().email().max(320),
  kind: z.enum(['transfer', 'resale']).optional(), // default 'transfer'
});

// Inferred types
export type TransferTicketFormData = z.infer<typeof transferTicketSchema>;
