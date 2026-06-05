import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { EntityKey } from '@eventology/config';
import { ENTITY_CONFIG } from '@eventology/config';
import type { ErrorEnvelope } from './list-handler';

// ---------------------------------------------------------------------------
// Factory: createDeleteHandler
// ---------------------------------------------------------------------------

/**
 * Creates a DELETE handler for a given entity.
 * Enforces auth and deletes the row by ID.
 * RLS enforces ownership.
 *
 * @param entity - Entity key from ENTITY_CONFIG
 */
export function createDeleteHandler(entity: EntityKey) {
  const config = ENTITY_CONFIG[entity];

  return async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) {
    const session = await auth.api.getSession({ headers: _req.headers });
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: { code: 'MISSING_PARAM', message: 'Missing id' } } satisfies ErrorEnvelope,
        { status: 400 }
      );
    }

    // Use authenticated client so RLS resolves auth.uid() to the profile UUID
    const supabase = await createAuthedClient(session.user.id);

    // First, check if the row exists and the user has access
    const { data: existing, error: fetchError } = await supabase
      .from(config.table)
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: fetchError.message } } satisfies ErrorEnvelope,
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `${config.label} not found or access denied` } } satisfies ErrorEnvelope,
        { status: 404 }
      );
    }

    // Now delete — use .select('id') to get the affected row count
    // This handles the case where a row is visible but not deletable (RLS policy
    // allows SELECT but not DELETE). Without .select(), delete returns 204 even
    // when 0 rows were removed.
    const { data: deleted, error } = await supabase
      .from(config.table)
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      // Map RLS denial to 403
      if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Not authorized to delete this resource' } } satisfies ErrorEnvelope,
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
        { status: 500 }
      );
    }

    // If no rows were deleted, the row exists but RLS denied the DELETE
    if (!deleted || deleted.length === 0) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not authorized to delete this resource' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }

    return new NextResponse(null, { status: 204 });
  };
}
