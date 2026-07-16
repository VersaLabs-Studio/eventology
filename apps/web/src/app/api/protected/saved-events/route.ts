import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createSavedEventSchema } from '@eventology/schemas';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

// Reuse the public event card field set so the mobile `MobileEvent` shape
// resolves unchanged (mirrors apps/web/src/app/api/public/events/route.ts).
const EVENT_CARD_SELECT = `
  *,
  category:categories!inner(id, name, slug, icon, color),
  organizer:organizers(id, name, slug, avatar_url, is_verified),
  ticket_tiers(id, name, price, currency, capacity, sold_count)
`;

/**
 * GET /api/protected/saved-events
 * List the caller's saved events (newest first), joined to the full event
 * card shape. Returns { data: EventCard[], meta }.
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
    .from('saved_events')
    .select(`id, created_at, event:events(${EVENT_CARD_SELECT})`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Flatten the join to the event card shape the clients expect.
  const events = (data ?? [])
    .map((row) => (row as { event?: unknown }).event)
    .filter((e): e is NonNullable<typeof e> => e != null);

  return NextResponse.json({
    data: events,
    meta: { total: count ?? 0, page, limit },
  } satisfies ListEnvelope<unknown>);
}

/**
 * POST /api/protected/saved-events
 * Save an event for the caller. Idempotent: a duplicate returns 200
 * { ok: true, already: true } instead of 500.
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

  const parsed = createSavedEventSchema.safeParse(body);
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

  const { event_id } = parsed.data;
  const supabase = await createAuthedClient(session.user.id);

  // profile_id is injected server-side from the session — never trusted from client.
  const { data, error } = await supabase
    .from('saved_events')
    .insert({ event_id, profile_id: session.user.id })
    .select()
    .single();

  if (error) {
    // UNIQUE(profile_id, event_id) violation → already saved.
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
