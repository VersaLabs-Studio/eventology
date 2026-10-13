// ============================================================================
// @eventology/utils — Registration state helpers
// ============================================================================
// Check-in stamps `registrations.checked_in_at` and KEEPS status 'confirmed':
// the registrations_count trigger (007) would decrement on any move away from
// 'confirmed', and fn_attended (043) gates on status = 'confirmed'. Nothing
// writes the 'checked_in' enum value, so derive the state from the timestamp
// (still honouring the enum in case a row ever carries it).
// ============================================================================

export interface CheckInFields {
  status?: string | null;
  checked_in_at?: string | null;
}

export function isCheckedIn(registration: CheckInFields): boolean {
  return registration.status === 'checked_in' || !!registration.checked_in_at;
}

/** Status to display: 'checked_in' once checked in, otherwise the stored status. */
export function registrationDisplayStatus<S extends string>(
  registration: { status: S; checked_in_at?: string | null }
): S | 'checked_in' {
  return isCheckedIn(registration) ? 'checked_in' : registration.status;
}
