// ============================================================================
// @eventology/schemas — Event Form Field Zod Schemas (HO-I)
// Source: 046_virtual_and_forms.sql
// ============================================================================
// Organizer-defined registration questions. Public read (form render),
// host-only write (RLS eff_write_host via fn_is_event_host).
// ============================================================================

import { z } from 'zod';
import { FORM_FIELD_TYPES } from '../enums';
import { pgUuid } from '../primitives';

// Full row shape (mirrors the generated `EventFormFieldRow`).
export const eventFormFieldSchema = z.object({
  id: pgUuid(),
  event_id: pgUuid(),
  label: z.string().min(1).max(200),
  field_type: z.enum(FORM_FIELD_TYPES),
  options: z.array(z.string()).nullable(),
  required: z.boolean(),
  position: z.number().int().min(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Create payload — id/position default; event_id from the route path.
export const createEventFormFieldSchema = z
  .object({
    label: z.string().trim().min(1, 'Label is required').max(200),
    field_type: z.enum(FORM_FIELD_TYPES),
    options: z.array(z.string().trim().min(1)).min(1).max(20).optional(),
    required: z.boolean().default(false),
    position: z.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.field_type === 'select' || data.field_type === 'multiselect') &&
        (!data.options || data.options.length < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select fields need at least one option',
        path: ['options'],
      });
    }
  });

// Update payload — all optional; event_id immutable.
export const updateEventFormFieldSchema = z.object({
  label: z.string().trim().min(1).max(200).optional(),
  field_type: z.enum(FORM_FIELD_TYPES).optional(),
  options: z.array(z.string().trim().min(1)).min(1).max(20).nullable().optional(),
  required: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

// Reorder payload — the builder's ordered list (no drag-drop designer per
// package constraints; position reindexing is enough).
export const reorderEventFormFieldsSchema = z.object({
  field_ids: z.array(pgUuid()).min(1).max(50),
});

export type EventFormFieldData = z.infer<typeof createEventFormFieldSchema>;
export type UpdateEventFormFieldData = z.infer<typeof updateEventFormFieldSchema>;
