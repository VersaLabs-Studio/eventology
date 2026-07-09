import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { EntityKey } from '@eventology/config';
import { ENTITY_CONFIG } from '@eventology/config';
import type { ErrorEnvelope } from './list-handler';

// ---------------------------------------------------------------------------
// Factory: createDocHandler
// ---------------------------------------------------------------------------

/**
 * Creates a GET single-document handler for a given entity.
 * Looks up by the provided column (default: 'id').
 *
 * @param entity   - Entity key from ENTITY_CONFIG
 * @param column   - Column to match on (default 'id', use 'slug' for slug lookups)
 * @param useAuthed - When true, requires auth and uses the caller's JWT client
 *                    so RLS (e.g. organizer-read-own) resolves ownership. Used by
 *                    protected single-doc routes where drafts/pending must be visible.
 */
export function createDocHandler(entity: EntityKey, column = 'id', useAuthed = false) {
  const config = ENTITY_CONFIG[entity];

  return async function GET(
    _req: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ) {
    let supabase: Awaited<ReturnType<typeof createClient>>;
    if (useAuthed) {
      const session = await auth.api.getSession({ headers: _req.headers });
      if (!session) {
        return NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
          { status: 401 }
        );
      }
      supabase = await createAuthedClient(session.user.id);
    } else {
      supabase = await createClient();
    }
    const { [column]: value } = await params;

    if (!value) {
      return NextResponse.json(
        { error: { code: 'MISSING_PARAM', message: `Missing ${column}` } } satisfies ErrorEnvelope,
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from(config.table)
      .select('*')
      .eq(column, value)
      .single();

    if (error) {
      const status = error.code === 'PGRST116' ? 404 : 500;
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `${config.label} not found` } } satisfies ErrorEnvelope,
        { status }
      );
    }

    return NextResponse.json(data);
  };
}
