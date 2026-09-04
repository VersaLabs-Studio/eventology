import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRoute, writeAuditLog } from '@/lib/api/admin-guard';
import { adminBadgeUpsertSchema, pgUuid } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/admin/badges — full catalog (HO-D). Admin-only.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdminRoute(req);
  if (!guard.ok) return guard.response;

  const { data, error } = await guard.service
    .from('badges')
    .select('*')
    .order('tier', { ascending: true })
    .order('points', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data ?? [] });
}

/**
 * POST /api/protected/admin/badges — add a catalog badge (HO-D). Admin-only.
 * Service client by design: badges has NO write policy for anyone, so catalog
 * management must bypass RLS (mirrors the 028 admin pattern).
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdminRoute(req);
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const parsed = adminBadgeUpsertSchema.safeParse(body);
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

  const { data, error } = await guard.service
    .from('badges')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    // UNIQUE(code) violation → badge code already exists.
    if (error.code === '23505') {
      return NextResponse.json(
        { error: { code: 'ALREADY_EXISTS', message: 'A badge with this code already exists' } } satisfies ErrorEnvelope,
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  await writeAuditLog(guard.service, {
    actor_id: guard.userId,
    action: 'system_config_changed',
    target_type: 'badge',
    target_id: (data as { id: string }).id,
    target_label: parsed.data.code,
    details: 'badge created',
  });

  return NextResponse.json(data, { status: 201 });
}

/**
 * PATCH /api/protected/admin/badges — update a catalog badge (HO-D).
 * Admin-only; `code` is immutable (it is the award contract used by
 * fn_award_badge call sites).
 */
export async function PATCH(req: NextRequest) {
  const guard = await requireAdminRoute(req);
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const parsed = adminBadgeUpsertSchema
    .omit({ code: true })
    .extend({ id: pgUuid() })
    .safeParse(body);

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

  const { id, ...updates } = parsed.data;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: { code: 'NO_FIELDS', message: 'No fields to update' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const { data, error } = await guard.service
    .from('badges')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Badge not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  await writeAuditLog(guard.service, {
    actor_id: guard.userId,
    action: 'system_config_changed',
    target_type: 'badge',
    target_id: id,
    target_label: (data as { code: string }).code,
    details: 'badge updated',
    new_values: updates,
  });

  return NextResponse.json(data);
}
