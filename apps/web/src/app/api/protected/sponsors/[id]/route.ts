// ============================================================================
// PATCH  /api/protected/sponsors/[id]
//   Update a sponsor. RLS `Sponsors: organizer manage` self-enforces
//   ownership. App-level lookup returns 404 if the row is invisible to
//   the caller (RLS-filtered).
//
// DELETE /api/protected/sponsors/[id]
//   Remove a sponsor. Same authorization.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { updateSponsorSchema } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
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
      { error: { code: 'MISSING_PARAM', message: 'sponsor id required' } } satisfies ErrorEnvelope,
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

  const parsed = updateSponsorSchema.safeParse(body);
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

  // Fetch first — RLS will return null for non-owners. We treat that as
  // 403 (not 404) because the row may exist, the caller just can't see it.
  const { data: current, error: fetchErr } = await supabase
    .from('sponsors')
    .select('id, event_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: fetchErr.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  if (!current) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Sponsor not found or not authorized' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  // Strip fields the client must not touch
  const updates: Record<string, unknown> = { ...parsed.data };
  delete updates.event_id; // cannot change event

  const { data, error } = await supabase
    .from('sponsors')
    .update(updates)
    .eq('id', id)
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
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
      { error: { code: 'MISSING_PARAM', message: 'sponsor id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  // RLS self-enforces: a non-owner sees zero rows and the delete is a
  // no-op. The .eq('id', id) limit makes that no-op scoped to the right
  // row, and we still get a successful response.
  const { error } = await supabase
    .from('sponsors')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
