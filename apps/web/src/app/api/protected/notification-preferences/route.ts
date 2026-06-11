// ============================================================================
// GET /api/protected/notification-preferences
// Returns the current user's notification_preferences row, creating
// one with defaults if it doesn't exist (UPSERT).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

const DEFAULTS = {
  email_enabled: true,
  sms_enabled: false,
  push_enabled: true,
  marketing_opt_in: false,
  locale: 'en' as const,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('profile_id', session.user.id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  if (data) {
    return NextResponse.json(data);
  }

  // No row — return defaults but don't insert yet (write happens on PATCH).
  // The first PATCH will UPSERT.
  return NextResponse.json({
    profile_id: session.user.id,
    ...DEFAULTS,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

/**
 * PATCH /api/protected/notification-preferences
 * Upsert the current user's preferences. Body: partial subset of prefs.
 */
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  let body: Partial<typeof DEFAULTS> & { quiet_hours_start?: string | null; quiet_hours_end?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Whitelist allowed fields
  const update: Record<string, unknown> = {};
  if (typeof body.email_enabled === 'boolean') update.email_enabled = body.email_enabled;
  if (typeof body.sms_enabled === 'boolean') update.sms_enabled = body.sms_enabled;
  if (typeof body.push_enabled === 'boolean') update.push_enabled = body.push_enabled;
  if (typeof body.marketing_opt_in === 'boolean') update.marketing_opt_in = body.marketing_opt_in;
  if (body.locale === 'en' || body.locale === 'am') update.locale = body.locale;
  if (body.quiet_hours_start !== undefined) update.quiet_hours_start = body.quiet_hours_start;
  if (body.quiet_hours_end !== undefined) update.quiet_hours_end = body.quiet_hours_end;

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: { code: 'NO_CHANGES', message: 'No valid preference fields provided' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Service-role for the UPSERT: notification_preferences is a per-user
  // singleton and the user-scoped RLS for UPSERT can be brittle.
  // We still pass the profile_id from the session, so no privilege escalation.
  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from('notification_preferences')
    .upsert(
      { profile_id: session.user.id, ...DEFAULTS, ...update },
      { onConflict: 'profile_id' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
