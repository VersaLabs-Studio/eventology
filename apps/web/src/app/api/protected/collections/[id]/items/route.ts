import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createCollectionItemSchema } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/collections/[id]/items — add an event to a list (HO-C).
 * Owner-only (RLS `ci_write_own` backstops). Idempotent:
 * UNIQUE(collection_id, event_id) violation (23505) → 200 { ok, already }.
 * `position` optional — server appends at the end when omitted.
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
      { error: { code: 'MISSING_PARAM', message: 'collection id required' } } satisfies ErrorEnvelope,
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

  const parsed = createCollectionItemSchema.safeParse(body);
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

  // Append position: after the current max (RLS scopes the SELECT to owned lists).
  let position = parsed.data.position;
  if (position === undefined) {
    const { data: last } = await supabase
      .from('collection_items')
      .select('position')
      .eq('collection_id', id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();
    position = ((last as { position: number } | null)?.position ?? -1) + 1;
  }

  const { data, error } = await supabase
    .from('collection_items')
    .insert({ collection_id: id, event_id: parsed.data.event_id, position })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, already: true }, { status: 200 });
    }
    // FK violation → collection or event does not exist (or not owned).
    if (error.code === '23503') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Collection or event not found' } } satisfies ErrorEnvelope,
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * DELETE /api/protected/collections/[id]/items?eventId= — remove an event.
 * Owner-only (RLS `ci_write_own` backstops). Idempotent: 204 either way.
 */
export async function DELETE(
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
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');
  if (!id || !eventId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'collection id and eventId are required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', id)
    .eq('event_id', eventId);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
