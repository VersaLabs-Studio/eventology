import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

/**
 * GET /api/public/events/[slug]/reviews
 * Returns paginated APPROVED reviews for an event + aggregate.
 *
 * RLS (`016:446`) ensures only approved reviews are returned to anon/public.
 * Aggregate is computed on-read from approved reviews.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing event slug' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 10)));
  const offset = (page - 1) * limit;

  // Resolve event id from slug
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single();

  if (eventError || !event) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  // Fetch approved reviews (RLS filters to approved only for anon)
  const { data: reviews, error, count } = await supabase
    .from('reviews')
    .select('id, rating, title, content, created_at, user_id', { count: 'exact' })
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Compute aggregate over APPROVED reviews (all of them, not just this page)
  const { data: allApproved } = await supabase
    .from('reviews')
    .select('rating')
    .eq('event_id', event.id);

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;
  for (const r of allApproved ?? []) {
    const rating = r.rating as 1 | 2 | 3 | 4 | 5;
    if (rating >= 1 && rating <= 5) {
      distribution[rating]++;
      total++;
      sum += rating;
    }
  }
  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

  return NextResponse.json({
    data: reviews ?? [],
    meta: {
      total: count ?? 0,
      page,
      limit,
    },
    aggregate: {
      average,
      count: total,
      distribution,
    },
  } satisfies ListEnvelope<unknown> & { aggregate: { average: number; count: number; distribution: Record<number, number> } });
}
