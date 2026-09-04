import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/events/[id]/registrations/export — CSV export of an
 * event's registrations INCLUDING custom-form answers (HO-I).
 *
 * Host-only via fn_is_event_host (same gate the registrations list relies
 * on RLS for — this derived route checks explicitly for a clean 403).
 *
 * CSV layout:
 *   attendee_name, attendee_email, attendee_phone, status, tier, registered_at,
 *   then one column per form field in position order ("<label>" headers).
 * Answers are pulled per registration and pivoted into the matching column.
 * CSV injection defense: values beginning with = + - @ are prefixed with '.
 */

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s =
    typeof value === 'object' ? JSON.stringify(value) : String(value);
  // Neutralize formula injection (=, +, -, @ prefixes) by quoting.
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing event id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  // Host gate (RLS on registrations would filter rows silently; a 403 is
  // clearer for a dashboard action).
  const { data: isHost } = await supabase.rpc('fn_is_event_host', {
    p_event_id: id,
    p_user: session.user.id,
  });
  if (isHost !== true) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Not the host of this event' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  // Form fields define the dynamic columns (position order).
  const { data: fields } = await supabase
    .from('event_form_fields')
    .select('id, label, position')
    .eq('event_id', id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  const fieldList = (fields ?? []) as Array<{ id: string; label: string }>;

  // Registrations + tier + answers (RLS: host reads all rows for the event).
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select(`
      id, attendee_name, attendee_email, attendee_phone, status, created_at,
      ticket_tier:ticket_tiers(name),
      answers:registration_answers(field_id, value)
    `)
    .eq('event_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const rows = (registrations ?? []) as Array<{
    id: string;
    attendee_name: string;
    attendee_email: string;
    attendee_phone: string | null;
    status: string;
    created_at: string;
    ticket_tier: { name: string } | { name: string }[] | null;
    answers: Array<{ field_id: string; value: unknown }> | null;
  }>;

  const header = [
    'attendee_name',
    'attendee_email',
    'attendee_phone',
    'status',
    'tier',
    'registered_at',
    ...fieldList.map((f) => f.label),
  ];

  const lines = [header.map(csvEscape).join(',')];

  for (const r of rows) {
    const tier = Array.isArray(r.ticket_tier) ? r.ticket_tier[0]?.name : r.ticket_tier?.name;
    const answerById = new Map(
      (r.answers ?? []).map((a) => [a.field_id, a.value])
    );
    lines.push(
      [
        r.attendee_name,
        r.attendee_email,
        r.attendee_phone,
        r.status,
        tier ?? '',
        r.created_at,
        ...fieldList.map((f) => answerById.get(f.id) ?? ''),
      ]
        .map(csvEscape)
        .join(',')
    );
  }

  // BOM so Excel opens UTF-8 (Amharic names) correctly.
  const csv = '\uFEFF' + lines.join('\r\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="registrations-${id}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
