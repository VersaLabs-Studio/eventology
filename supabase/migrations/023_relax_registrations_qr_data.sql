-- ============================================================================
-- Migration 023: Relax registrations.qr_data
-- BLOCKER A: qr_data is NOT NULL UNIQUE on registrations (007:53), but
-- create_registration_atomic (021) omits it — every registration 500s.
-- QR now lives on tickets.qr_data; registrations.qr_data is vestigial.
-- ============================================================================

-- Drop the UNIQUE constraint on registrations.qr_data
-- (QR uniqueness now enforced on tickets.qr_data and tickets.registration_id)
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_qr_data_key;

-- Drop the NOT NULL constraint (RPC omits qr_data; it's no longer needed)
ALTER TABLE public.registrations ALTER COLUMN qr_data DROP NOT NULL;

-- Drop the now-unnecessary index on registrations.qr_data
DROP INDEX IF EXISTS idx_registrations_qr_data;
