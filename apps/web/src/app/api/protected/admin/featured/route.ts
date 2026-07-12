// ============================================================================
// GET /api/protected/admin/featured
//   List featured events (is_featured=true) ordered by featured_until desc.
// POST /api/protected/admin/featured
//   Pin an event for a duration (7d / 14d / 30d). Audit log.
// DELETE /api/protected/admin/featured?id=...
//   Unpin an event. Audit log.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pgUuid } from '@eventology/schemas';
import { requireAdminRoute, writeAuditLog } from '@/lib/api/admin-guard';
import type { ErrorEnvelope } from '@/lib/api';

interface FeaturedRow {
  id: string;
  slug: string;
  title: string;
  banner_image: string | null;
  is_featured: boolean;
  featured_until: string | null;
  status: string;
  start_date: string;
  organizer: { id: string; name: string } | null;
  category: { id: string; name: string; color: string } | null;
}

export async function GET(req: NextRequest) {
  const guard = await requireAdminRoute(req);
  if (!guard.ok) return guard.response;
  const { service } = guard;

  const { data, error } = await service
    .from('events')
    .select(`
      id, slug, title, banner_image, is_featured, featured_until,
      status, start_date,
      organizer:organizers!events_organizer_id_fkey(id, name),
      category:categories!events_category_id_fkey(id, name, color)
    `)
    .eq('is_featured', true)
    .order('featured_until', { ascending: false, nullsFirst: false });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const rows: FeaturedRow[] = (data ?? []).map((r) => {
    const o = Array.isArray(r.organizer) ? r.organizer[0] : r.organizer;
    const c = Array.isArray(r.category) ? r.category[0] : r.category;
    return { ...(r as Omit<FeaturedRow, 'organizer' | 'category'>), organizer: o, category: c };
  });

  return NextResponse.json({ data: rows });
}

const featureSchema = z.object({
  // pgUuid (not z.string().uuid()) — DB/seed event IDs use version-0 UUIDs
  // that Zod v4's .uuid() rejects, which surfaced as "Invalid request body".
  event_id: pgUuid(),
  duration: z.enum(['7_days', '14_days', '30_days']),
});

function durationDays(d: '7_days' | '14_days' | '30_days'): number {
  return d === '7_days' ? 7 : d === '14_days' ? 14 : 30;
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminRoute(req);
  if (!guard.ok) return guard.response;
  const { service, userId } = guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const parsed = featureSchema.safeParse(body);
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

  const days = durationDays(parsed.data.duration);
  const featuredUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { data: current, error: fetchErr } = await service
    .from('events')
    .select('id, title, is_featured, featured_until')
    .eq('id', parsed.data.event_id)
    .maybeSingle();
  if (fetchErr) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: fetchErr.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  if (!current) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  const { data, error } = await service
    .from('events')
    .update({
      is_featured: true,
      featured_until: featuredUntil,
    })
    .eq('id', parsed.data.event_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  await writeAuditLog(service, {
    actor_id: userId,
    action: 'event_featured',
    target_type: 'event',
    target_id: parsed.data.event_id,
    target_label: current.title,
    details: `Event "${current.title}" featured for ${days} days`,
    new_values: { is_featured: true, featured_until: featuredUntil },
    old_values: {
      is_featured: current.is_featured,
      featured_until: current.featured_until,
    },
  });

  return NextResponse.json(data);
}

const unfeatureSchema = z.object({
  event_id: pgUuid(),
});

export async function DELETE(req: NextRequest) {
  const guard = await requireAdminRoute(req);
  if (!guard.ok) return guard.response;
  const { service, userId } = guard;

  // DELETE bodies are not always parsed; support both ?id= and JSON body
  const url = new URL(req.url);
  let eventId = url.searchParams.get('id') ?? '';
  if (!eventId) {
    try {
      const body = await req.json();
      const parsed = unfeatureSchema.safeParse(body);
      if (parsed.success) eventId = parsed.data.event_id;
    } catch {
      // fall through
    }
  }

  if (!eventId) {
    return NextResponse.json(
      { error: { code: 'MISSING_ID', message: 'Event id is required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const { data: current, error: fetchErr } = await service
    .from('events')
    .select('id, title, is_featured, featured_until')
    .eq('id', eventId)
    .maybeSingle();
  if (fetchErr) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: fetchErr.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  if (!current) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  const { data, error } = await service
    .from('events')
    .update({
      is_featured: false,
      featured_until: null,
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  await writeAuditLog(service, {
    actor_id: userId,
    action: 'event_unfeatured',
    target_type: 'event',
    target_id: eventId,
    target_label: current.title,
    details: `Event "${current.title}" unfeatured by admin`,
    new_values: { is_featured: false, featured_until: null },
    old_values: {
      is_featured: current.is_featured,
      featured_until: current.featured_until,
    },
  });

  return NextResponse.json(data);
}
