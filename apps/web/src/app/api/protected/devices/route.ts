// ============================================================================
// POST   /api/protected/devices
//   Upsert the caller's Expo push token. Matched on
//   (profile_id, token). Updates last_seen. RLS: caller is always
//   profile_id=auth.uid(), so RLS `Notifications: own read` does not
//   apply — but the table is new. We rely on the authed client + an
//   explicit "force profile_id = caller" check so a malicious client
//   cannot register a token for someone else's profile.
//
// DELETE /api/protected/devices
//   Deregister the caller's Expo push token (on sign-out, etc.).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

const upsertSchema = z.object({
  token: z.string().min(10).max(512),
  platform: z.enum(['ios', 'android', 'web']),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
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

  const parsed = upsertSchema.safeParse(body);
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

  // Force profile_id = caller's id so the row is bound to the session.
  const { data, error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        profile_id: session.user.id,
        token: parsed.data.token,
        platform: parsed.data.platform,
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'profile_id,token' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const schema = z.object({ token: z.string().min(10) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'token is required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('profile_id', session.user.id)
    .eq('token', parsed.data.token);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
