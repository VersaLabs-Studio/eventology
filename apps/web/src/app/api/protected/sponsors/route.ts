// ============================================================================
// GET  /api/protected/sponsors?event_id=...
//   List sponsors for the given event. RLS `Sponsors: organizer manage`
//   self-enforces organizer ownership for the caller's own events.
//   We DO NOT add an authed-client call here — the existing
//   `createListHandler('sponsors')` factory is too generic (no event_id
//   filter); this thin specialized handler is the organizer-scoped list.
//
// POST /api/protected/sponsors
//   Create a sponsor on an event the caller owns. RLS enforces ownership;
//   we also re-verify at the app layer with a single ownership lookup
//   so the 403 envelope is uniform.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createSponsorSchema } from '@eventology/schemas';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

export interface SponsorRow {
  id: string;
  event_id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  sort_order: number;
  is_active: boolean;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('event_id')?.trim() ?? '';
  if (!eventId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'event_id is required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // RLS `Sponsors: organizer manage` enforces ownership — the query
  // returns nothing for non-owners. The error code in that case is empty
  // (PostgREST doesn't surface RLS denial as an error), so we don't need
  // a manual ownership check here.
  const { data, error, count } = await supabase
    .from('sponsors')
    .select('*', { count: 'exact' })
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: (data ?? []) as SponsorRow[],
    meta: { total: count ?? 0, page: 1, limit: data?.length ?? 0 },
  } satisfies ListEnvelope<SponsorRow>);
}

const createBodySchema = createSponsorSchema.extend({
  event_id: z.string().uuid(),
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

  const parsed = createBodySchema.safeParse(body);
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

  // App-level ownership check: caller must be the organizer that owns
  // the event. RLS would silently filter to 0 rows on the insert path,
  // which makes debugging harder. Verify explicitly first.
  const { data: callerOrg } = await supabase
    .from('organizers')
    .select('id')
    .eq('profile_id', session.user.id)
    .maybeSingle();

  if (!callerOrg) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'No organizer profile for caller' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  const { data: event, error: eventErr } = await supabase
    .from('events')
    .select('id, organizer_id')
    .eq('id', parsed.data.event_id)
    .maybeSingle();

  if (eventErr) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: eventErr.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  if (!event) {
    return NextResponse.json(
      { error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }
  if (event.organizer_id !== callerOrg.id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Not the owner of this event' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  const { event_id, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from('sponsors')
    .insert({ event_id, ...rest })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
