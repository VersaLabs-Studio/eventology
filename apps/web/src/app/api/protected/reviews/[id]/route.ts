import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * PUT /api/protected/reviews/[id]
 * Edit own review (rating, title, content only — moderation fields are stripped).
 * RLS ensures the caller can only edit their own review.
 */
const editReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(255).nullable().optional(),
  content: z.string().max(5000).nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing review id' } } satisfies ErrorEnvelope,
      { status: 400 }
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

  const parsed = editReviewSchema.safeParse(body);
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

  // RLS ensures caller can only update their own review.
  // Moderation fields (is_approved, is_flagged, etc.) are NOT in the schema,
  // so they cannot be set from the body.
  const { data, error } = await supabase
    .from('reviews')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Review not found or not yours' } } satisfies ErrorEnvelope,
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
