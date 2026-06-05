// ============================================================================
// @eventology/schemas — Sponsor Zod Schemas
// Source: 011_sponsors.sql
// ============================================================================

import { z } from 'zod';
import { SPONSOR_TIERS } from '../enums';

// ---------------------------------------------------------------------------
// Base schema (matches DB constraints exactly)
// ---------------------------------------------------------------------------

export const sponsorSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  name: z.string().min(1, 'Sponsor name is required').max(255),
  logo_url: z.string().url().nullable(),
  website: z.string().url().nullable(),
  description: z.string().max(2000).nullable(),
  tier: z.enum(SPONSOR_TIERS),
  sort_order: z.number().int(),
  is_active: z.boolean(),
  contact_name: z.string().nullable(),
  contact_email: z.string().email().nullable(),
  contact_phone: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Create schema
// ---------------------------------------------------------------------------

export const createSponsorSchema = sponsorSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    tier: z.enum(SPONSOR_TIERS).default('bronze'),
    sort_order: z.number().int().default(0),
    is_active: z.boolean().default(true),
    metadata: z.record(z.string(), z.unknown()).default({}),
  });

// ---------------------------------------------------------------------------
// Update schema
// ---------------------------------------------------------------------------

export const updateSponsorSchema = createSponsorSchema.partial();

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type SponsorFormData = z.infer<typeof createSponsorSchema>;
export type SponsorUpdateData = z.infer<typeof updateSponsorSchema>;

