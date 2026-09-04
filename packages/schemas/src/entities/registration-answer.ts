// ============================================================================
// @eventology/schemas — Registration Answer Zod Schemas (HO-I)
// Source: 046_virtual_and_forms.sql
// ============================================================================
// Attendee responses to custom registration questions. Owner + host
// readable (RLS); INSERT/UPDATE via the answers route which validates
// values server-side against the event's field definitions.
//
// NOTE: there is deliberately no per-field "value" Zod schema here — the
// value's shape depends on the field_type stored in the DB, so validation
// happens in the route against the LOADED field definitions
// (validateAnswers in lib/registration/validate-answers.ts). The route
// schema only checks transport shape (field_id is a uuid, value present).
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

// Full row shape (mirrors the generated `RegistrationAnswerRow`).
export const registrationAnswerSchema = z.object({
  id: pgUuid(),
  registration_id: pgUuid(),
  field_id: pgUuid(),
  value: z.unknown(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// One answer as submitted by the client.
export const submitAnswerSchema = z.object({
  field_id: pgUuid(),
  value: z.unknown(),
});

// POST /api/protected/registrations/[id]/answers
export const submitAnswersSchema = z.object({
  answers: z.array(submitAnswerSchema).min(1).max(50),
});

export type SubmitAnswersData = z.infer<typeof submitAnswersSchema>;
