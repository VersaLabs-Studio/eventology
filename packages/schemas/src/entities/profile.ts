// ============================================================================
// @eventology/schemas — Profile Zod Schemas
// Source: 003_users_profiles.sql
// ============================================================================

import { z } from 'zod';
import { USER_ROLES } from '../enums';

// ---------------------------------------------------------------------------
// Base schema (matches DB constraints exactly)
// ---------------------------------------------------------------------------

export const profileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1, 'Full name is required').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  role: z.enum(USER_ROLES),
  is_active: z.boolean(),
  bio: z.string().max(2000).nullable(),
  website: z.string().url().nullable(),
  social_links: z.record(z.string(), z.unknown()).default({}),
  preferences: z.record(z.string(), z.unknown()).default({}),
  last_seen_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Create schema (omit auto-generated fields)
// ---------------------------------------------------------------------------

export const createProfileSchema = profileSchema
  .omit({
    id: true,
    last_seen_at: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    role: z.enum(USER_ROLES).default('attendee'),
    is_active: z.boolean().default(true),
    social_links: z.record(z.string(), z.unknown()).default({}),
    preferences: z.record(z.string(), z.unknown()).default({}),
  });

// ---------------------------------------------------------------------------
// Update schema (all fields optional)
// ---------------------------------------------------------------------------

export const updateProfileSchema = createProfileSchema.partial();

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type ProfileFormData = z.infer<typeof createProfileSchema>;
export type ProfileUpdateData = z.infer<typeof updateProfileSchema>;

