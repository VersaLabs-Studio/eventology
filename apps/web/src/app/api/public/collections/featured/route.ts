import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/public/collections/featured — editorial featured lists (HO-C).
 * Consumed by discovery surfaces (HO-J). RLS `col_select_visible` scopes rows
 * to public/unlisted for anonymous callers; `is_editorial`/`is_featured` are
 * admin-set via the service-role route only.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit') ?? 6)));

  const { data, error } = await supabase
    .from('collections')
    .select('id, title, description, slug, cover_url, owner:profiles!collections_owner_id_fkey(full_name), items:collection_items(count)')
    .eq('is_editorial', true)
    .eq('is_featured', true)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const collections = (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const items = r.items as Array<{ count: number }> | null;
    const { items: _drop, ...rest } = r;
    void _drop;
    return { ...rest, event_count: items?.[0]?.count ?? 0 };
  });

  return NextResponse.json({ data: collections });
}
