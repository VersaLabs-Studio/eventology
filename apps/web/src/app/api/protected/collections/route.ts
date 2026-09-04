import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createCollectionSchema } from '@eventology/schemas';
import { slugify } from '@/lib/utils';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

/** Short unique suffix for server-generated slugs (title→slug + short id). */
function shortId(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}

/**
 * GET /api/protected/collections — list the CALLER's collections (HO-C).
 * Explicit owner filter: RLS would also expose other users' public/unlisted
 * collections, but this endpoint is "my lists" only. Includes event counts.
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
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 50)));
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('collections')
    .select('*, items:collection_items(count)', { count: 'exact' })
    .eq('owner_id', session.user.id)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Flatten `items: [{count}]` → event_count
  const collections = (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const items = r.items as Array<{ count: number }> | null;
    const { items: _drop, ...rest } = r;
    void _drop;
    return { ...rest, event_count: items?.[0]?.count ?? 0 };
  });

  return NextResponse.json({
    data: collections,
    meta: { total: count ?? 0, page, limit },
  } satisfies ListEnvelope<unknown>);
}

/**
 * POST /api/protected/collections — create a user list (HO-C).
 * Invariants:
 * 1. owner_id injected from the session — never the client.
 * 2. is_editorial forced false (RLS backstop: col_insert_own) — editorial
 *    creation is admin-only via the service-role route.
 * 3. Slug generated server-side: title→slug + short id (never client-supplied).
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

  const parsed = createCollectionSchema.safeParse(body);
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

  const slug = `${slugify(parsed.data.title) || 'list'}-${shortId()}`;

  const { data, error } = await supabase
    .from('collections')
    .insert({
      owner_id: session.user.id, // injected server-side, never trusted from client
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      visibility: parsed.data.visibility ?? 'private',
      slug,
      is_editorial: false,
      is_featured: false,
    })
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
