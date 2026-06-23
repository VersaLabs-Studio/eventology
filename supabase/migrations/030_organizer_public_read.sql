-- Migration 030: Organizer public read for approved events
-- Purpose: Allow anon/public to read organizers who own at least one approved
-- event, even if they aren't verified yet. RLS policies OR together, so the
-- existing "is_verified" policy stays intact.
--
-- This fixes the null-organizer problem: approved events by unverified
-- organizers now show the organizer's public profile (name/avatar/bio) to
-- anonymous users.

-- Public can read organizers that own at least one approved event
CREATE POLICY "Organizers: public read for approved events"
  ON public.organizers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.organizer_id = organizers.id
        AND e.status = 'approved'
    )
  );
