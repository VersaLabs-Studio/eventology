import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { updateCollectionSchema } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * PATCH /api/protected/collections/[id] — rename / visibility / cover (HO-C).
 * Owner-only (RLS `col_update_own` backstops). is_editorial/is_featured are
 * NOT updatable here — admin-only via the service-role admin route.
 */
export async function PATCH(
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

  const parsed = updateCollectionSchema.safeParse(body);
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

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { error: { code: 'NO_FIELDS', message: 'No fields to update' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  const { data, error } = await supabase
    .from('collections')
    .update(parsed.data)
    .eq('id', id)
    .eq('owner_id', session.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  if (!data) {
    // Not found OR not owned (RLS + owner filter make it a no-op).
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Collection not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/protected/collections/[id] — delete a collection (items cascade).
 * Owner-only (RLS `col_delete_own` backstops). Idempotent: 204 either way.
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
  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'collection id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)
    .eq('owner_id', session.user.id);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
