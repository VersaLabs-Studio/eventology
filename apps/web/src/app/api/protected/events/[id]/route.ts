import { NextRequest, NextResponse } from 'next/server';
import { createUpdateHandler, createDeleteHandler } from '@/lib/api';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { updateEventSchema } from '@eventology/schemas';
import { stripOnlineUrl } from '@/lib/events/sanitize-event';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET by id — authed so organizers can read their own draft/pending events
 * (public endpoint only returns approved events by slug).
 *
 * HO-I: the row includes online_url (046). Hosts see it; every other
 * authed user gets the stripped shape — the gated join-link endpoint is
 * the only non-host reveal path. (The generic doc handler would return
 * select(*) verbatim, so events gets a custom GET.)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
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
      { error: { code: 'MISSING_PARAM', message: 'Missing id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
      { status }
    );
  }

  const { data: isHost } = await supabase.rpc('fn_is_event_host', {
    p_event_id: id,
    p_user: session.user.id,
  });

  return NextResponse.json(isHost === true ? data : stripOnlineUrl(data));
}

export const PUT = createUpdateHandler('events', updateEventSchema);
export const DELETE = createDeleteHandler('events');
