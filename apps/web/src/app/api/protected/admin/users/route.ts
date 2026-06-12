// ============================================================================
// GET /api/protected/admin/users
//   List profiles with their registration count + role + active flag.
//   Supports ?search= (full_name / email), ?role= (attendee|organizer|admin),
//   ?status= (active|inactive), ?page=, ?limit=.
//
// PATCH /api/protected/admin/users/[id]
//   Activate / deactivate a profile (is_active toggle). Writes audit_log.
//
// Service-role justified: list needs to span all roles and join
// registration counts across organizers/attendees — RLS would split the
// read into multiple queries.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminRoute, writeAuditLog } from '@/lib/api/admin-guard';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';
import type { Database } from '@eventology/schemas';

type UserRole = Database['public']['Enums']['user_role'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface AdminUserRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  last_seen_at: string | null;
  events_attended: number;
}

function escapeSearchTerm(term: string): string {
  return term.replace(/[,()*]/g, '\\$&');
}

export async function GET(req: NextRequest) {
  const guard = await requireAdminRoute(req);
  if (!guard.ok) return guard.response;
  const { service } = guard;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const search = searchParams.get('search')?.trim() ?? '';
  const role = searchParams.get('role')?.trim() ?? '';
  const status = searchParams.get('status')?.trim() ?? '';
  const offset = (page - 1) * limit;

  // 1. Profiles page (with optional filters)
  let q = service
    .from('profiles')
    .select('id, full_name, email, phone, role, is_active, avatar_url, created_at, last_seen_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    const escaped = escapeSearchTerm(search);
    q = q.or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
  }
  if (role && role !== 'all') {
    q = q.eq('role', role as UserRole);
  }
  if (status === 'active') {
    q = q.eq('is_active', true);
  } else if (status === 'inactive') {
    q = q.eq('is_active', false);
  }

  const { data, error, count } = await q;
  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // 2. events_attended per user — count registrations grouped by user_id
  // (only the page in view, to keep the response small)
  const ids = (data ?? []).map((r) => r.id);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: regRows } = await service
      .from('registrations')
      .select('user_id')
      .in('user_id', ids);
    for (const r of regRows ?? []) {
      counts.set(r.user_id as string, (counts.get(r.user_id as string) ?? 0) + 1);
    }
  }

  const rows: AdminUserRow[] = (data ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    phone: p.phone,
    role: p.role,
    is_active: p.is_active,
    avatar_url: p.avatar_url,
    created_at: p.created_at,
    last_seen_at: p.last_seen_at,
    events_attended: counts.get(p.id) ?? 0,
  }));

  return NextResponse.json({
    data: rows,
    meta: { total: count ?? 0, page, limit },
  } satisfies ListEnvelope<AdminUserRow>);
}

const patchSchema = z.object({
  is_active: z.boolean().optional(),
  role: z.enum(['attendee', 'organizer', 'admin']).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const guard = await requireAdminRoute(req);
  if (!guard.ok) return guard.response;
  const { service, userId } = guard;
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_ID', message: 'User id is required' } } satisfies ErrorEnvelope,
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

  const parsed = patchSchema.safeParse(body);
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

  if (parsed.data.is_active === undefined && parsed.data.role === undefined) {
    return NextResponse.json(
      { error: { code: 'NO_CHANGES', message: 'No fields to update' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Load current row for audit_log old_values + label
  const { data: current, error: fetchErr } = await service
    .from('profiles')
    .select('id, full_name, email, role, is_active')
    .eq('id', id)
    .maybeSingle();
  if (fetchErr) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: fetchErr.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  if (!current) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'User not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  const { data, error } = await service
    .from('profiles')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Audit log — one row per change kind
  const oldRow = current as Pick<ProfileRow, 'role' | 'is_active'>;
  if (parsed.data.is_active !== undefined && parsed.data.is_active !== oldRow.is_active) {
    await writeAuditLog(service, {
      actor_id: userId,
      action: parsed.data.is_active ? 'user_activated' : 'user_deactivated',
      target_type: 'profile',
      target_id: id,
      target_label: current.email,
      details: `User ${parsed.data.is_active ? 'activated' : 'deactivated'} by admin`,
      new_values: { is_active: parsed.data.is_active },
      old_values: { is_active: oldRow.is_active },
    });
  }
  if (parsed.data.role !== undefined && parsed.data.role !== oldRow.role) {
    await writeAuditLog(service, {
      actor_id: userId,
      action: 'user_role_changed',
      target_type: 'profile',
      target_id: id,
      target_label: current.email,
      details: `Role changed from ${oldRow.role} to ${parsed.data.role}`,
      new_values: { role: parsed.data.role },
      old_values: { role: oldRow.role },
    });
  }

  return NextResponse.json(data);
}
