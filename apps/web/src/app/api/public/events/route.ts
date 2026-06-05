import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

/**
 * Escapes special characters in a PostgREST `.or()` search term.
 * Commas, parentheses, and asterisks break the filter syntax.
 */
function escapeSearchTerm(term: string): string {
  return term.replace(/[,()*]/g, '\\$&');
}

const SELECT_FIELDS = `
  *,
  category:categories!inner(id, name, slug, icon, color),
  organizer:organizers(id, name, slug, avatar_url, is_verified),
  ticket_tiers(id, name, price, currency, capacity, sold_count)
`;

const SELECT_FIELDS_NO_CATEGORY = `
  *,
  category:categories(id, name, slug, icon, color),
  organizer:organizers(id, name, slug, avatar_url, is_verified),
  ticket_tiers(id, name, price, currency, capacity, sold_count)
`;

/**
 * GET /api/public/events
 * Returns published events with joined category, organizer, and ticket tiers.
 * Supports: page, limit, search, category, sort
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const search = searchParams.get('search')?.trim() ?? '';
  const category = searchParams.get('category')?.trim() ?? '';
  const sort = searchParams.get('sort') ?? 'date-desc';
  const offset = (page - 1) * limit;

  // Use inner join when filtering by category so the filter applies
  // at the join level (PostgREST behavior for !inner hints)
  let query = supabase
    .from('events')
    .select(category ? SELECT_FIELDS : SELECT_FIELDS_NO_CATEGORY, { count: 'exact' })
    .eq('status', 'approved')
    .range(offset, offset + limit - 1);

  // Search — escape special characters to prevent PostgREST filter syntax breakage
  if (search) {
    const escaped = escapeSearchTerm(search);
    query = query.or(
      `title.ilike.%${escaped}%,description.ilike.%${escaped}%,short_description.ilike.%${escaped}%`
    );
  }

  // Category filter (uses !inner join so it filters top-level rows)
  if (category) {
    query = query.eq('category.slug', category);
  }

  // Sort
  switch (sort) {
    case 'date-asc':
      query = query.order('start_date', { ascending: true });
      break;
    case 'date-desc':
      query = query.order('start_date', { ascending: false });
      break;
    case 'popular':
      query = query.order('registrations_count', { ascending: false });
      break;
    case 'name':
      query = query.order('title', { ascending: true });
      break;
    case 'featured':
      query = query.order('is_featured', { ascending: false }).order('start_date', { ascending: false });
      break;
    default:
      query = query.order('start_date', { ascending: false });
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { total: count ?? 0, page, limit },
  } satisfies ListEnvelope<unknown>);
}
