// ============================================================================
// @eventology/schemas — Organizer Zod Schemas
// Source: 004_organizers.sql
// ============================================================================

import { z } from 'zod';
import type { OrganizerRow } from '../generated/database.types';
import { VERIFICATION_STATUSES } from '../enums';

// ---------------------------------------------------------------------------
// Base schema (matches DB constraints exactly)
// ---------------------------------------------------------------------------

export const organizerSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  name: z.string().min(1, 'Organization name is required').max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  email: z.string().email(),
  phone: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  bio: z.string().max(5000).nullable(),
  website: z.string().url().nullable(),
  social_links: z.record(z.string(), z.unknown()).default({}),
  is_verified: z.boolean(),
  verification_status: z.enum(VERIFICATION_STATUSES),
  verification_notes: z.string().nullable(),
  events_count: z.number().int().min(0),
  total_attendees: z.number().int().min(0),
  stripe_account_id: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}) satisfies z.ZodType<OrganizerRow>;

// ---------------------------------------------------------------------------
// Create schema
// ---------------------------------------------------------------------------

export const createOrganizerSchema = organizerSchema
  .omit({
    id: true,
    is_verified: true,
    verification_notes: true,
    events_count: true,
    total_attendees: true,
    stripe_account_id: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    verification_status: z.enum(VERIFICATION_STATUSES).default('pending'),
    social_links: z.record(z.string(), z.unknown()).default({}),
    metadata: z.record(z.string(), z.unknown()).default({}),
  });

// ---------------------------------------------------------------------------
// Update schema
// ---------------------------------------------------------------------------

export const updateOrganizerSchema = createOrganizerSchema.partial();

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type OrganizerFormData = z.infer<typeof createOrganizerSchema>;
export type OrganizerUpdateData = z.infer<typeof updateOrganizerSchema>;

