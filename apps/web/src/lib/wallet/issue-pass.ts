import { SupabaseClient } from '@supabase/supabase-js';
import type { WalletTicket } from '@eventology/wallet';

/**
 * Wallet pass issuance bookkeeping (HO-H).
 *
 * All writes use the SERVICE client (045 has no client write policy — the
 * schema comment mandates service context for issuance/rotation). The caller
 * is responsible for having already verified ticket OWNERSHIP via the authed
 * client (RLS) before calling.
 *
 * Get-or-issue semantics under UNIQUE(ticket_id, platform):
 *   - no row            → insert (fresh serial)
 *   - row, active, mine → reuse serial
 *   - row, revoked OR
 *     ownership moved   → reissue: rotate the serial, re-bind to the caller,
 *                         clear revoked (HO-G's transfer trigger revokes on
 *                         ownership change; the new owner gets a new serial)
 */
export async function getOrIssuePass(
  service: SupabaseClient,
  ticketId: string,
  profileId: string,
  platform: 'apple' | 'google'
): Promise<{ serial: string; reused: boolean } | { error: string }> {
  const { data: existing } = await service
    .from('wallet_passes')
    .select('id, serial, revoked, profile_id')
    .eq('ticket_id', ticketId)
    .eq('platform', platform)
    .maybeSingle();

  if (existing) {
    const row = existing as { id: string; serial: string; revoked: boolean; profile_id: string };
    if (!row.revoked && row.profile_id === profileId) {
      return { serial: row.serial, reused: true };
    }
    // Reissue: rotate serial, re-bind to the current owner.
    const serial = newSerial();
    const { error } = await service
      .from('wallet_passes')
      .update({ profile_id: profileId, serial, revoked: false })
      .eq('id', row.id);
    if (error) return { error: error.message };
    return { serial, reused: false };
  }

  const serial = newSerial();
  const { error } = await service
    .from('wallet_passes')
    .insert({ ticket_id: ticketId, profile_id: profileId, platform, serial });
  if (error) return { error: error.message };
  return { serial, reused: false };
}

/** Serial shape: PSG-<uuid> — globally unique, Apple-compatible charset. */
export function newSerial(): string {
  return `PSG-${crypto.randomUUID()}`;
}

/** Builds the server-side ticket snapshot the provider renders into a pass. */
export function toWalletTicket(
  ticket: {
    id: string;
    ticket_number: string;
    tier_name: string;
    qr_data: string;
    event: { title: string; start_date: string; venue_name: string | null } | null;
    registration: { attendee_name: string; attendee_email: string } | null;
  },
  serial: string
): WalletTicket {
  const event = Array.isArray(ticket.event) ? ticket.event[0] : ticket.event;
  const registration = Array.isArray(ticket.registration)
    ? ticket.registration[0]
    : ticket.registration;

  return {
    ticketId: ticket.id,
    ticketNumber: ticket.ticket_number,
    tierName: ticket.tier_name,
    qrData: ticket.qr_data,
    eventTitle: event?.title ?? 'Eventology Event',
    eventStartsAt: event?.start_date ?? new Date().toISOString(),
    venueName: event?.venue_name ?? null,
    attendeeName: registration?.attendee_name ?? 'Attendee',
    attendeeEmail: registration?.attendee_email ?? '',
    serial,
  };
}
