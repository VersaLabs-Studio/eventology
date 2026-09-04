import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { submitAnswersSchema } from '@eventology/schemas';
import { validateAnswers } from '@/lib/registration/validate-answers';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/registrations/[id]/answers — submit custom-form
 * answers for a registration (HO-I).
 *
 * Invariants:
 * 1. The registration must belong to the caller (RLS ra_insert_own /
 *    ra_modify_own also enforces; ownership checked here for a clean 403).
 * 2. Answers are validated SERVER-SIDE against the event's field
 *    definitions — required omission, unknown fields, and wrong shapes
 *    (options membership, types) are rejected. Never trust the client.
 * 3. Upsert on UNIQUE(registration_id, field_id): resubmission updates
 *    prior answers (ra_modify_own covers the UPDATE half).
 * 4. field_id/registration bindings injected from the URL — never the client.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing registration id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const parsed = submitAnswersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parsed.error.flatten(),
        },
      } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  // Ownership + event resolution for the registration (RLS scopes reads to
  // own rows; a foreign registration id → PGRST116 here).
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select('id, event_id, user_id')
    .eq('id', id)
    .maybeSingle();

  if (regError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: regError.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  if (!registration) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Registration not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  const reg = registration as { id: string; event_id: string; user_id: string };
  if (reg.user_id !== session.user.id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Not your registration' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  // Load THIS event's field definitions — validation truth (P6).
  const { data: fields, error: fieldsError } = await supabase
    .from('event_form_fields')
    .select('id, label, field_type, options, required')
    .eq('event_id', reg.event_id);

  if (fieldsError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: fieldsError.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // No form defined on this event → nothing to answer.
  if (!fields || fields.length === 0) {
    return NextResponse.json(
      { error: { code: 'NO_FORM', message: 'This event has no custom registration form' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const result = validateAnswers(fields, parsed.data.answers);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: {
          code: 'ANSWER_VALIDATION_FAILED',
          message: result.error,
          ...(result.field_id ? { details: { field_id: result.field_id } } : {}),
        },
      } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Upsert — idempotent resubmission (UNIQUE(registration_id, field_id)).
  const rows = Object.entries(result.values).map(([fieldId, value]) => ({
    registration_id: reg.id, // from the URL — never the client
    field_id: fieldId,
    value,
  }));

  const { error: upsertError } = await supabase
    .from('registration_answers')
    .upsert(rows, { onConflict: 'registration_id,field_id' });

  if (upsertError) {
    if (upsertError.code === '42501' || upsertError.message.includes('row-level security')) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not your registration' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: upsertError.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, saved: rows.length }, { status: 201 });
}
