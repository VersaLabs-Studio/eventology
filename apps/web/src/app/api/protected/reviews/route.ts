import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createReviewSchema } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/reviews
 * Submit a review for an event the caller attended.
 *
 * D10-001 invariants:
 * 1. Inject user_id = session.user.id via createAuthedClient.
 * 2. Force is_approved = false on create (moderated).
 * 3. Attendance gate: caller must have a non-cancelled registration
 *    (ideally a used ticket, or the event has ended).
 * 4. UNIQUE(event_id, user_id) → 23505 → 409 ALREADY_REVIEWED.
 * 5. Reject with 403 NOT_ATTENDED if the caller has no qualifying registration.
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
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

  const parsed = createReviewSchema.safeParse(body);
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

  const { event_id, rating, title, content, metadata } = parsed.data;

  const supabase = await createAuthedClient(session.user.id);

  // ATTENDANCE GATE: caller must have attended the event.
  // Qualifying if:
  //   - they have a confirmed registration AND
  //   - (the event has ended OR they have a ticket with status 'used')
  const { data: regData } = await supabase
    .from('registrations')
    .select('id, status, event:events(id, end_date)')
    .eq('event_id', event_id)
    .eq('user_id', session.user.id)
    .neq('status', 'cancelled')
    .maybeSingle();

  const registration = regData as unknown as { id: string; status: string; event: { id: string; end_date: string } | null } | null;

  if (!registration) {
    return NextResponse.json(
      { error: { code: 'NOT_ATTENDED', message: 'You must have attended this event to review it' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  // Check if the event has ended OR the caller has a used ticket
  const eventEnded = registration.event?.end_date
    ? new Date(registration.event.end_date) < new Date()
    : false;

  if (!eventEnded) {
    // Check for a used ticket
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, status')
      .eq('user_id', session.user.id)
      .eq('event_id', event_id)
      .eq('status', 'used')
      .maybeSingle();

    if (!ticket) {
      return NextResponse.json(
        { error: { code: 'NOT_ATTENDED', message: 'You can only review events you have attended' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }
  }

  // Force server-controlled fields: user_id from session, is_approved = false
  // Schema already strips is_approved/is_flagged/flag_reason, but defense in depth:
  const reviewData = {
    event_id,
    user_id: session.user.id, // inject from session, never trust client
    rating,
    title: title ?? null,
    content: content ?? null,
    is_approved: false, // force moderation
    is_flagged: false,
    flag_reason: null,
    metadata: metadata ?? {},
  };

  const { data, error } = await supabase
    .from('reviews')
    .insert(reviewData)
    .select()
    .single();

  if (error) {
    // UNIQUE(event_id, user_id) violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: { code: 'ALREADY_REVIEWED', message: 'You have already reviewed this event' } } satisfies ErrorEnvelope,
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
