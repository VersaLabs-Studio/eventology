// ============================================================================
// GET /api/protected/admin/audit-log
//   Paginated list of audit entries. Joins the actor profile so the
//   UI can render "actor name + role" without a follow-up query.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRoute } from '@/lib/api/admin-guard';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

export interface AuditLogRow {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  target_label: string | null;
  details: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
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
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') ?? 50)));
  const action = searchParams.get('action')?.trim() ?? '';
  const actor = searchParams.get('actor')?.trim() ?? '';
  const search = searchParams.get('search')?.trim() ?? '';
  const from = searchParams.get('from')?.trim() ?? '';
  const to = searchParams.get('to')?.trim() ?? '';
  const offset = (page - 1) * limit;

  let q = service
    .from('audit_log')
    .select(`
      id, action, target_type, target_id, target_label, details,
      old_values, new_values, ip_address, user_agent, created_at, actor_id,
      actor:profiles!audit_log_actor_id_fkey(full_name, role)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (action && action !== 'all') {
    q = q.eq('action', action);
  }
  if (search) {
    const escaped = escapeSearchTerm(search);
    q = q.or(`target_label.ilike.%${escaped}%,details.ilike.%${escaped}%`);
  }
  if (from) q = q.gte('created_at', from);
  if (to) q = q.lt('created_at', to);

  const { data, error, count } = await q;
  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const rows: AuditLogRow[] = (data ?? []).map((r) => {
    const a = Array.isArray(r.actor) ? r.actor[0] : r.actor;
    return {
      id: r.id,
      action: r.action,
      target_type: r.target_type,
      target_id: r.target_id,
      target_label: r.target_label,
      details: r.details,
      old_values: (r.old_values ?? null) as Record<string, unknown> | null,
      new_values: (r.new_values ?? null) as Record<string, unknown> | null,
      ip_address: r.ip_address,
      user_agent: r.user_agent,
      created_at: r.created_at,
      actor_id: r.actor_id,
      actor_name: a?.full_name ?? null,
      actor_role: a?.role ?? null,
    };
  });

  // Filter by actor (name) post-hoc since joining + filtering is awkward
  const filtered = actor
    ? rows.filter((r) => r.actor_name?.toLowerCase().includes(actor.toLowerCase()))
    : rows;

  return NextResponse.json({
    data: filtered,
    meta: { total: count ?? 0, page, limit },
  } satisfies ListEnvelope<AuditLogRow>);
}
