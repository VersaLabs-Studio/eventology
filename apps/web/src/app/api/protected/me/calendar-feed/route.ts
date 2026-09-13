import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { calendarFeedTokenCreateSchema } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * /api/protected/me/calendar-feed — subscribe-token management (HO-K).
 *
 *   GET    → active (non-revoked) tokens for the caller, one per kind
 *   POST   → create/rotate: revokes the caller's prior active token of the
 *            same kind (append-only history — never UPDATE the token value),
 *            then inserts a fresh one
 *   DELETE → ?kind=my_events|saved — revoke (the feed URL dies with 410)
 *
 * Token generation: 32 random bytes → base64url. Server-generated ONLY
 * (never accepted from the client); never encodes identity. RLS
 * (cft_select_own / cft_write_own) scopes every read/write to the caller;
 * profile_id is session-injected.
 */

/** 32 random bytes, base64url — opaque, unguessable, identity-free. */
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const KINDS = ['my_events', 'saved'] as const;
type Kind = (typeof KINDS)[number];

function parseKind(value: string | null): Kind | null {
  return KINDS.includes(value as Kind) ? (value as Kind) : null;
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  const { data, error } = await supabase
    .from('calendar_feed_tokens')
    .select('id, kind, created_at, token')
    .eq('revoked', false)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // One active token per kind is the model; return the newest of each.
  const seen = new Set<string>();
  const active = (data ?? []).filter((r) => {
    const kind = (r as { kind: string }).kind;
    if (seen.has(kind)) return false;
    seen.add(kind);
    return true;
  });

  return NextResponse.json({ data: active });
}

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

  const parsed = calendarFeedTokenCreateSchema.safeParse(body);
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

  const kind = parsed.data.kind;
  const supabase = await createAuthedClient(session.user.id);

  // Rotate: revoke the prior active token of the same kind (append-only).
  const { error: revokeError } = await supabase
    .from('calendar_feed_tokens')
    .update({ revoked: true })
    .eq('profile_id', session.user.id)
    .eq('kind', kind)
    .eq('revoked', false);

  if (revokeError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: revokeError.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const token = generateToken();
  const { data, error } = await supabase
    .from('calendar_feed_tokens')
    .insert({
      profile_id: session.user.id, // session-injected, never the client
      token,
      kind,
    })
    .select('id, kind, token, created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Full subscribe URL is assembled client-side (NEXT_PUBLIC_APP_URL is not
  // authoritative behind proxies); return the token and let the card render
  // the URL. Token is shown to its owner only — it never leaves this shape.
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const kind = parseKind(req.nextUrl.searchParams.get('kind'));
  if (!kind) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'kind must be my_events or saved' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  const { error } = await supabase
    .from('calendar_feed_tokens')
    .update({ revoked: true })
    .eq('profile_id', session.user.id)
    .eq('kind', kind)
    .eq('revoked', false);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
