import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createOrganizerFollowSchema } from '@eventology/schemas';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

// Public organizer card field set (subset safe to expose to the follower).
const ORGANIZER_CARD_SELECT = `
  id, name, slug, avatar_url, bio, is_verified, events_count
`;

/**
 * GET /api/protected/follows
 * List organizers the caller follows (newest first), joined to the organizer
 * card shape. Returns { data: OrganizerCard[], meta }.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('organizer_follows')
    .select(`id, created_at, organizer:organizers(${ORGANIZER_CARD_SELECT})`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Flatten the join to the organizer card shape the clients expect.
  const organizers = (data ?? [])
    .map((row) => (row as { organizer?: unknown }).organizer)
    .filter((o): o is NonNullable<typeof o> => o != null);

  return NextResponse.json({
    data: organizers,
    meta: { total: count ?? 0, page, limit },
  } satisfies ListEnvelope<unknown>);
}

/**
 * POST /api/protected/follows
 * Follow an organizer for the caller. Idempotent: a duplicate returns 200
 * { ok: true, already: true }.
 */
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

  const parsed = createOrganizerFollowSchema.safeParse(body);
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

  const { organizer_id } = parsed.data;
  const supabase = await createAuthedClient(session.user.id);

  // profile_id is injected server-side from the session — never trusted from client.
  const { data, error } = await supabase
    .from('organizer_follows')
    .insert({ organizer_id, profile_id: session.user.id })
    .select()
    .single();

  if (error) {
    // UNIQUE(profile_id, organizer_id) violation → already followed.
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, already: true }, { status: 200 });
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
