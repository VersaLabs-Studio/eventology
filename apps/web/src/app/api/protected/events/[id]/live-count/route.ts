import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/events/[id]/live-count — live check-in count (HO-M).
 *
 * POLLED, not realtime (LOCKED): putting `tickets` or `registrations` on
 * the realtime publication to animate a number would expose a high-churn,
 * sensitive table's change stream. The attendee UI polls this lightweight
 * endpoint on a ~15s interval while the live window is open.
 *
 * Gate: confirmed attendee (RLS own-registration read) or host (RPC).
 * The aggregate count itself is computed via service-role — an attendee's
 * RLS scope cannot count OTHER attendees' rows, and the aggregate carries
 * no personal data.
 */
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

  // Host gate.
  const { data: isHost } = await supabase.rpc('fn_is_event_host', {
    p_event_id: id,
    p_user: session.user.id,
  });

  if (isHost !== true) {
    // Attendee gate — confirmed registration (RLS scopes to own rows).
    const { data: reg } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')
      .maybeSingle();

    if (!reg) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Live view is available to confirmed attendees only' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }
  }

  const service = createServiceClient();

  const { count, error } = await service
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .eq('status', 'checked_in');

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(
    { count: count ?? 0 },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
