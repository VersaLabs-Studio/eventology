// ============================================================================
// GET /api/protected/admin/organizers
//   List organizers + their profile. Supports ?status= (pending|verified|rejected|all).
//
// POST /api/protected/admin/organizers/[id]/verify
//   Flip organizer to verified. Audit log + best-effort notify (organizer).
//
// POST /api/protected/admin/organizers/[id]/reject
//   Flip organizer to rejected with a reason. Audit log + best-effort notify.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminRoute, writeAuditLog } from '@/lib/api/admin-guard';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

export interface AdminOrganizerRow {
  id: string;
  profile_id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  is_verified: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_notes: string | null;
  events_count: number;
  total_attendees: number;
  created_at: string;
  // Joined from profiles
  full_name: string | null;
  is_active: boolean | null;
  last_seen_at: string | null;
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
  const status = searchParams.get('status')?.trim() ?? '';
  const offset = (page - 1) * limit;

  let q = service
    .from('organizers')
    .select(`
      id, profile_id, name, slug, email, phone, avatar_url, bio, website,
      is_verified, verification_status, verification_notes, events_count,
      total_attendees, created_at,
      profile:profiles!organizers_profile_id_fkey(full_name, is_active, last_seen_at)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    const escaped = escapeSearchTerm(search);
    q = q.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%,bio.ilike.%${escaped}%`);
  }
  if (status && status !== 'all') {
    q = q.eq('verification_status', status as 'pending' | 'verified' | 'rejected');
  }

  const { data, error, count } = await q;
  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const rows: AdminOrganizerRow[] = (data ?? []).map((r) => {
    // profile comes back as either an object or an array (PostgREST behavior)
    const p = Array.isArray(r.profile) ? r.profile[0] : r.profile;
    return {
      id: r.id,
      profile_id: r.profile_id,
      name: r.name,
      slug: r.slug,
      email: r.email,
      phone: r.phone,
      avatar_url: r.avatar_url,
      bio: r.bio,
      website: r.website,
      is_verified: r.is_verified,
      verification_status: r.verification_status,
      verification_notes: r.verification_notes,
      events_count: r.events_count,
      total_attendees: r.total_attendees,
      created_at: r.created_at,
      full_name: p?.full_name ?? null,
      is_active: p?.is_active ?? null,
      last_seen_at: p?.last_seen_at ?? null,
    };
  });

  return NextResponse.json({
    data: rows,
    meta: { total: count ?? 0, page, limit },
  } satisfies ListEnvelope<AdminOrganizerRow>);
}

const rejectSchema = z.object({
  reason: z.string().min(1).max(500),
});
