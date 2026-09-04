import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

/**
 * GET /api/public/events/[slug]/form-fields — render the registration form
 * (HO-I). Public read by design: eff_select_all lets anon visitors fetch
 * the organizer's questions so the form renders pre-auth. Labels/options
 * only — no attendee data here, nothing to sanitize.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing slug' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createClient();

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

  const { data, error } = await supabase
    .from('event_form_fields')
    .select('id, label, field_type, options, required, position')
    .eq('event_id', event.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { total: data?.length ?? 0, page: 1, limit: 100 },
  } satisfies ListEnvelope<unknown>);
}
