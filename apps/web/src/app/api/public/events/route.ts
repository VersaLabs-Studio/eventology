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
 * Computes the start of the current week (Monday) in UTC.
 */
function startOfWeek(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday = 1
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString();
}

/**
 * Computes the start of the next week (Monday) in UTC.
 */
function endOfWeek(): string {
  const start = new Date(startOfWeek());
  start.setUTCDate(start.getUTCDate() + 7);
  return start.toISOString();
}

/**
 * Computes the start of the current month in UTC.
 */
function startOfMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * Computes the start of the next month in UTC.
 */
function endOfMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

/**
 * GET /api/public/events
 * Returns published events with joined category, organizer, and ticket tiers.
 *
 * Filters:
 *   - search: text search over title/description/short_description
 *   - category: category slug (uses !inner join)
 *   - date: 'today' | 'this-week' | 'this-month' | 'upcoming'
 *   - from / to: ISO date range (overrides date preset)
 *   - price: 'free' | 'paid'
 *   - city / venue: sub_city or venue_name filter
 *   - sort: 'date-asc' | 'date-desc' | 'popular' | 'name' | 'featured' | 'price-asc' | 'price-desc'
 *   - type: event_type filter
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const search = searchParams.get('search')?.trim() ?? '';
  const category = searchParams.get('category')?.trim() ?? '';
  const sort = searchParams.get('sort') ?? 'date-desc';
  const datePreset = searchParams.get('date')?.trim() ?? '';
  const dateFrom = searchParams.get('from')?.trim() ?? '';
  const dateTo = searchParams.get('to')?.trim() ?? '';
  const price = searchParams.get('price')?.trim() ?? '';
  const city = searchParams.get('city')?.trim() ?? '';
  const venue = searchParams.get('venue')?.trim() ?? '';
  const eventType = searchParams.get('type')?.trim() ?? '';
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

  // Date filtering
  const now = new Date().toISOString();

  if (dateFrom && dateTo) {
    // Explicit date range takes precedence
    query = query.gte('start_date', dateFrom).lt('start_date', dateTo);
  } else if (dateFrom) {
    query = query.gte('start_date', dateFrom);
  } else if (dateTo) {
    query = query.lt('start_date', dateTo);
  } else if (datePreset) {
    switch (datePreset) {
      case 'today':
        // Events starting today (UTC day boundary)
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);
        query = query.gte('start_date', todayStart.toISOString()).lt('start_date', todayEnd.toISOString());
        break;
      case 'this-week':
        query = query.gte('start_date', startOfWeek()).lt('start_date', endOfWeek());
        break;
      case 'this-month':
        query = query.gte('start_date', startOfMonth()).lt('start_date', endOfMonth());
        break;
      case 'upcoming':
        query = query.gte('start_date', now);
        break;
    }
  }

  // Price filter
  if (price === 'free') {
    query = query.eq('ticket_type', 'free');
  } else if (price === 'paid') {
    query = query.eq('ticket_type', 'paid');
  }

  // City / venue filters
  if (city) {
    query = query.ilike('sub_city', `%${city}%`);
  }
  if (venue) {
    query = query.ilike('venue_name', `%${venue}%`);
  }

  // Event type filter
  if (eventType) {
    query = query.eq('event_type', eventType);
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
    case 'price-asc':
      query = query.order('ticket_type', { ascending: true }).order('start_date', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('ticket_type', { ascending: false }).order('start_date', { ascending: true });
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
