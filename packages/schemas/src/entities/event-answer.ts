// ============================================================================
// @eventology/schemas — Event Answer Zod Schemas
// Source: 039_event_qa.sql
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

// Full row shape (mirrors the generated `EventAnswerRow` from database.types.ts).
export const eventAnswerSchema = z.object({
  id: pgUuid(),
  question_id: pgUuid(),
  author_id: pgUuid(),
  body: z.string().min(1).max(2000),
  is_official: z.boolean(),
  is_hidden: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Create payload — `author_id` is session-injected; `is_official` is set
// server-side when the caller is the event host (never trusted from client).
export const createEventAnswerSchema = z.object({
  body: z.string().min(1).max(2000),
});

// Update payload — author-only (RLS ea_modify_own is the enforcement backstop).
export const updateEventAnswerSchema = z.object({
  body: z.string().min(1).max(2000).optional(),
  is_hidden: z.boolean().optional(),
});

// Inferred types
export type EventAnswerFormData = z.infer<typeof createEventAnswerSchema>;
export type UpdateEventAnswerData = z.infer<typeof updateEventAnswerSchema>;
