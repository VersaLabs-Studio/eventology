import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthedClient } from '@/lib/supabase/server';
import { requireAdminRoute } from '@/lib/api/admin-guard';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

/**
 * GET /api/protected/admin/reviews
 * List all reviews (approved, pending, flagged) for admin moderation.
 * RLS `Reviews: admin full access` gates access.
 *
 * PATCH /api/protected/admin/reviews
 * Approve or flag a review. Sets moderated_by + moderated_at.
 */

const moderateSchema = z.object({
  id: z.string().uuid(),
  is_approved: z.boolean().optional(),
  is_flagged: z.boolean().optional(),
  flag_reason: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  // R1 audit debt: migrate from inline role-check to requireAdminRoute.
  const guard = await requireAdminRoute(req);
  if (!guard.ok) return guard.response;
  const { authed: supabase } = guard;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const status = searchParams.get('status')?.trim() ?? '';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('reviews')
    .select('*, event:events(id, title, slug)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status === 'pending') {
    query = query.eq('is_approved', false).eq('is_flagged', false);
  } else if (status === 'approved') {
    query = query.eq('is_approved', true);
  } else if (status === 'flagged') {
    query = query.eq('is_flagged', true);
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

export async function PATCH(req: NextRequest) {
  // R1 audit debt: migrate from inline role-check to requireAdminRoute.
  const guard = await requireAdminRoute(req);
  if (!guard.ok) return guard.response;
  const { authed: supabase, userId } = guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const parsed = moderateSchema.safeParse(body);
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

  // RLS `Reviews: admin full access` gates this
  const { data, error } = await supabase
    .from('reviews')
    .update({
      ...parsed.data,
      moderated_by: userId,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not authorized or review not found' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
