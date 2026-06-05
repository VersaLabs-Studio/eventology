import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { verifyQRPayload } from '@/lib/tickets/qr';
import { checkInSchema } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/check-in
 * Organizer scans QR code to check in an attendee.
 * Verifies HMAC signature before marking attendance.
 *
 * SEV-3: Auth ordering — organizer check happens before any ticket state
 * disclosure to prevent information leakage to non-organizer users.
 *
 * Service-role justified: check-in requires cross-table verification
 * (ticket + registration + event + organizer) that RLS can't express.
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Zod validation (cheap, no DB)
  const parsed = checkInSchema.safeParse(body);
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

  const { qr_data } = parsed.data;

  // Service-role justified: cross-table verification (ticket + registration + event + organizer)
  const supabase = createServiceClient();

  // SEV-3: Verify organizer BEFORE any ticket state disclosure.
  // First, check if the user is an organizer at all.
  const { data: organizer } = await supabase
    .from('organizers')
    .select('id')
    .eq('profile_id', session.user.id)
    .maybeSingle();

  if (!organizer) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Not an organizer' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  // Verify HMAC signature (cheap crypto, no DB)
  const payload = verifyQRPayload(qr_data);
  if (!payload) {
    return NextResponse.json(
      { error: { code: 'INVALID_QR', message: 'Invalid or tampered QR code' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Fetch ticket (now we know the caller is at least an organizer)
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', payload.ticketId)
    .single();

  if (ticketError || !ticket) {
    return NextResponse.json(
      { error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  // Verify registration ID matches
  if (ticket.registration_id !== payload.registrationId) {
    return NextResponse.json(
      { error: { code: 'INVALID_QR', message: 'QR code does not match ticket' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // SEV-3: Verify the organizer owns THIS event before disclosing ticket state
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', ticket.event_id)
    .eq('organizer_id', organizer.id)
    .maybeSingle();

  if (!event) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Not authorized to check in for this event' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  // Now that we know the caller is the organizer for this event,
  // we can safely disclose ticket state.
  if (ticket.status === 'used') {
    return NextResponse.json(
      { error: { code: 'ALREADY_CHECKED_IN', message: 'Ticket has already been used' } } satisfies ErrorEnvelope,
      { status: 409 }
    );
  }

  if (ticket.status !== 'valid') {
    return NextResponse.json(
      { error: { code: 'INVALID_TICKET', message: `Ticket status is ${ticket.status}` } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Mark ticket as used
  const { error: updateError } = await supabase
    .from('tickets')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('id', ticket.id);

  if (updateError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: updateError.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Mark registration as checked in
  const { error: regError } = await supabase
    .from('registrations')
    .update({ checked_in_at: new Date().toISOString() })
    .eq('id', ticket.registration_id);

  if (regError) {
    // Log but don't fail - ticket is already marked as used
    console.error('[CheckIn] Failed to update registration:', regError);
  }

  return NextResponse.json({
    success: true,
    ticket: {
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      tier_name: ticket.tier_name,
      status: 'used',
    },
  });
}
