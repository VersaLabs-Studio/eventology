import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ErrorEnvelope } from '@/lib/api';

const SELECT_FIELDS = `
  *,
  category:categories(id, name, slug, icon, color),
  organizer:organizers(id, name, slug, avatar_url, bio, website, is_verified, social_links, events_count, total_attendees, created_at),
  ticket_tiers(id, name, description, price, currency, capacity, sold_count, sort_order)
`;

/**
 * GET /api/public/events/[slug]
 * Returns a single published event by slug with full joins.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const supabase = await createClient();
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing slug' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('events')
    .select(SELECT_FIELDS)
    .eq('slug', slug)
    .eq('status', 'approved')
    .single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
      { status }
    );
  }

  return NextResponse.json(data);
}
