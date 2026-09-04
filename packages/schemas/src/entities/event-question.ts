// ============================================================================
// @eventology/schemas — Event Question Zod Schemas
// Source: 039_event_qa.sql
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

// Full row shape (mirrors the generated `EventQuestionRow` from database.types.ts).
export const eventQuestionSchema = z.object({
  id: pgUuid(),
  event_id: pgUuid(),
  author_id: pgUuid(),
  body: z.string().min(3).max(1000),
  is_pinned: z.boolean(),
  is_hidden: z.boolean(),
  upvotes: z.number().int().min(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Create payload — `author_id`, `is_pinned`, `is_hidden` and `upvotes` are
// server-controlled (session-injected / defaults).
export const createEventQuestionSchema = z.object({
  event_id: pgUuid(),
  body: z.string().min(3).max(1000),
});

// Update payload — `is_pinned`/`is_hidden` are host-only (enforced server-side
// against fn_is_event_host); body edits are author/host (RLS eq_update_own_or_host).
export const updateEventQuestionSchema = z.object({
  body: z.string().min(3).max(1000).optional(),
  is_pinned: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
});

// Minimal author projection used in threads.
export const qaAuthorSchema = z.object({
  id: pgUuid(),
  full_name: z.string(),
  avatar_url: z.string().nullable(),
});

// Inferred types
export type EventQuestionFormData = z.infer<typeof createEventQuestionSchema>;
export type UpdateEventQuestionData = z.infer<typeof updateEventQuestionSchema>;
