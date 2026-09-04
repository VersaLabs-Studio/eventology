import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRoute, writeAuditLog } from '@/lib/api/admin-guard';
import { z } from 'zod';
import { pgUuid } from '@eventology/schemas';
import { slugify } from '@/lib/utils';
import type { ErrorEnvelope } from '@/lib/api';

const createEditorialSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  cover_url: z.string().optional(),
  feature: z.boolean().optional(),
});

const patchEditorialSchema = z.object({
  id: pgUuid(),
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
  cover_url: z.string().nullable().optional(),
  is_featured: z.boolean().optional(),
});

function shortId(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}

/**
 * POST /api/protected/admin/collections — create an EDITORIAL collection
 * (HO-C). Admin-only (requireAdminRoute). Uses the SERVICE client by design:
 * the client INSERT policy forces is_editorial = false, so admin editorial
 * creation must bypass RLS (mirrors the 028 admin pattern).
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

  const parsed = createEditorialSchema.safeParse(body);
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

  const slug = `${slugify(parsed.data.title) || 'collection'}-${shortId()}`;

  const { data, error } = await guard.service
    .from('collections')
    .insert({
      owner_id: guard.userId, // editorial lists are owned by the admin actor
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      cover_url: parsed.data.cover_url ?? null,
      is_editorial: true,
      is_featured: parsed.data.feature ?? false,
      visibility: 'public',
      slug,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  await writeAuditLog(guard.service, {
    actor_id: guard.userId,
    action: 'system_config_changed',
    target_type: 'collection',
    target_id: (data as { id: string }).id,
    target_label: parsed.data.title,
    details: 'editorial collection created',
  });

  return NextResponse.json(data, { status: 201 });
}

/**
 * PATCH /api/protected/admin/collections — update an editorial collection
 * (rename / cover / feature / unfeature). Admin-only; ONLY editorial rows are
 * mutable here (user lists belong to their owners).
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

  const parsed = patchEditorialSchema.safeParse(body);
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
    .from('collections')
    .update(updates)
    .eq('id', id)
    .eq('is_editorial', true) // never touch user lists
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
      { error: { code: 'NOT_FOUND', message: 'Editorial collection not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  await writeAuditLog(guard.service, {
    actor_id: guard.userId,
    action: 'system_config_changed',
    target_type: 'collection',
    target_id: id,
    target_label: (data as { title: string }).title,
    details: 'editorial collection updated',
    new_values: updates,
  });

  return NextResponse.json(data);
}
