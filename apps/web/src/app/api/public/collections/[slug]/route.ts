import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { stripOnlineUrlDeep } from '@/lib/events/sanitize-event';
import type { ErrorEnvelope } from '@/lib/api';

// Same join shape the public events endpoints use, so the client can run
// rows through transformEvent and render standard EventCards.
const EVENT_CARD_SELECT = `
  *,
  category:categories!inner(id, name, slug, icon, color),
  organizer:organizers(id, name, slug, avatar_url, is_verified),
  ticket_tiers(id, name, price, currency, capacity, sold_count)
`;

/**
 * GET /api/public/collections/[slug] — shareable collection view (HO-C).
 *
 * Public/unlisted collections are readable by anyone; private only by the
 * owner (RLS `col_select_visible`). When a session exists the authed client
 * is used so owners can view their own private lists via the share URL;
 * everyone else gets a 404 for private lists.
 *
 * Returns { collection, events: joinedEventCards (ordered by position) }.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing collection slug' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Optional session: owners may open their own private list's share URL.
  const session = await auth.api.getSession({ headers: req.headers });
  const supabase = session ? await createAuthedClient(session.user.id) : await createClient();

  const { data: collection } = await supabase
    .from('collections')
    .select('*, owner:profiles!collections_owner_id_fkey(id, full_name, avatar_url), items:collection_items(count)')
    .eq('slug', slug)
    .maybeSingle();

  if (!collection) {
    // Private lists 404 for non-owners (RLS hides the row entirely).
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Collection not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  const collectionId = (collection as { id: string }).id;

  const { data: items, error } = await supabase
    .from('collection_items')
    .select(`position, event:events(${EVENT_CARD_SELECT})`)
    .eq('collection_id', collectionId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Flatten the join to the event card shape; skip dangling rows defensively
  // (FK is NOT NULL + CASCADE so in practice every row joins).
  const events = (items ?? [])
    .map((row) => (row as { event?: unknown }).event)
    .filter((e): e is NonNullable<typeof e> => e != null);

  const row = collection as Record<string, unknown>;
  const itemsCount = row.items as Array<{ count: number }> | null;
  const { items: _drop, ...rest } = row;
  void _drop;

  // HO-I: event rows are select(*) embeds — strip the secret online_url
  // before the payload leaves (gated join-link endpoint is the only reveal).
  const safe = stripOnlineUrlDeep({ collection: { ...rest, event_count: itemsCount?.[0]?.count ?? 0 }, events });

  return NextResponse.json(safe);
}
