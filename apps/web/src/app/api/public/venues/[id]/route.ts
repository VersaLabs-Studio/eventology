import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/public/venues/[id]
 * Returns a single venue by ID.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const supabase = await createClient();
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing venue id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Venue not found' } } satisfies ErrorEnvelope,
      { status }
    );
  }

  return NextResponse.json(data);
}
