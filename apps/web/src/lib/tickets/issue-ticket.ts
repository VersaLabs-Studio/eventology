import { SupabaseClient } from '@supabase/supabase-js';
import { signQRPayload } from '@/lib/tickets/qr';

/**
 * Issues a ticket for a confirmed registration.
 * Signs the QR payload with HMAC-SHA256.
 * Must be called from server-side code with a service-role client.
 *
 * IDEMPOTENT: if a ticket already exists for this registration, returns it
 * instead of inserting a second one (FIX-005).
 *
 * @param registrationId - The registration UUID
 * @param supabase - Supabase client (service-role for system ops)
 * @returns Object with success status and ticket data (including signed QR)
 */
export async function issueTicket(
  registrationId: string,
  supabase: SupabaseClient
): Promise<{
  success: boolean;
  ticket?: {
    id: string;
    ticket_number: string;
    qr_data: string;
    tier_name: string;
    status: string;
  };
  error?: string;
}> {
  // FIX-005: Idempotency — return existing ticket if one exists
  const { data: existingTicket } = await supabase
    .from('tickets')
    .select('id, ticket_number, qr_data, tier_name, status')
    .eq('registration_id', registrationId)
    .maybeSingle();

  if (existingTicket) {
    return { success: true, ticket: existingTicket };
  }

  // Get the registration
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', registrationId)
    .single();

  if (regError || !registration) {
    return { success: false, error: 'Registration not found' };
  }

  // Get the ticket tier name
  const { data: ticketTier } = await supabase
    .from('ticket_tiers')
    .select('name')
    .eq('id', registration.ticket_tier_id)
    .single();

  // Generate ticket number
  const ticketNumber = `TKT-${registration.id.substring(0, 8).toUpperCase()}`;

  // Generate a UUID for the ticket (so we can sign the QR with it)
  const { v4: uuidv4 } = await import('uuid');
  const ticketId = uuidv4();

  // Sign the QR payload with HMAC-SHA256
  const qrData = signQRPayload(ticketId, registration.id);

  // Insert the ticket with signed QR
  // If a race condition inserts between our check and this insert,
  // the UNIQUE constraint on registration_id will cause this to fail,
  // and we'll return the error (the caller can retry).
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      id: ticketId,
      registration_id: registration.id,
      event_id: registration.event_id,
      user_id: registration.user_id,
      ticket_number: ticketNumber,
      qr_data: qrData,
      tier_name: ticketTier?.name ?? 'General',
      status: 'valid',
    })
    .select('id, ticket_number, qr_data, tier_name, status')
    .single();

  if (ticketError) {
    // If UNIQUE constraint violation, try to fetch the existing ticket
    if (ticketError.code === '23505') {
      const { data: raceTicket } = await supabase
        .from('tickets')
        .select('id, ticket_number, qr_data, tier_name, status')
        .eq('registration_id', registrationId)
        .maybeSingle();

      if (raceTicket) {
        return { success: true, ticket: raceTicket };
      }
    }
    return { success: false, error: ticketError.message };
  }

  return { success: true, ticket };
}
