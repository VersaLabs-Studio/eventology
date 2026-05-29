-- ============================================================================
-- Migration 016: RLS Policies
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Row-Level Security policies for ALL tables. Enforces:
-- - Public read for approved/active content
-- - Owner CRUD for their own data
-- - Organizer CRUD for their own events
-- - Admin full access
-- - Authenticated write for registrations/messages
-- ============================================================================

-- ==========================================================================
-- ENABLE RLS ON ALL TABLES
-- ==========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- ==========================================================================
-- HELPER: Check if current user is admin
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================================================
-- HELPER: Check if current user is organizer for an event
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.is_event_organizer(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON e.organizer_id = o.id
    WHERE e.id = p_event_id AND o.profile_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================================================
-- HELPER: Check if current user is organizer (by organizer_id)
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.is_organizer(p_organizer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organizers
    WHERE id = p_organizer_id AND profile_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================================================
-- HELPER: Check if current user is team member of an organizer
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.is_team_member(p_organizer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organizer_team_members
    WHERE organizer_id = p_organizer_id
      AND profile_id = auth.uid()
      AND accepted_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================================================
-- PROFILES
-- ==========================================================================

-- Anyone can view active profiles
CREATE POLICY "Profiles: public read"
  ON public.profiles FOR SELECT
  USING (is_active = true);

-- Users can view their own profile (including inactive)
CREATE POLICY "Profiles: own profile read"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Profiles: own profile update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins have full access
CREATE POLICY "Profiles: admin full access"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- ORGANIZERS
-- ==========================================================================

-- Public can view verified organizers
CREATE POLICY "Organizers: public read verified"
  ON public.organizers FOR SELECT
  USING (is_verified = true);

-- Organizers can view their own record
CREATE POLICY "Organizers: own read"
  ON public.organizers FOR SELECT
  USING (profile_id = auth.uid());

-- Organizers can update their own record
CREATE POLICY "Organizers: own update"
  ON public.organizers FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Authenticated users can create organizer profiles
CREATE POLICY "Organizers: authenticated create"
  ON public.organizers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND profile_id = auth.uid());

-- Admins have full access
CREATE POLICY "Organizers: admin full access"
  ON public.organizers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- ORGANIZER TEAM MEMBERS
-- ==========================================================================

-- Organizer owners/admins can view their team
CREATE POLICY "Team: organizer read"
  ON public.organizer_team_members FOR SELECT
  USING (public.is_organizer(organizer_id) OR public.is_team_member(organizer_id));

-- Organizer owners can manage team
CREATE POLICY "Team: owner manage"
  ON public.organizer_team_members FOR ALL
  USING (public.is_organizer(organizer_id))
  WITH CHECK (public.is_organizer(organizer_id));

-- Admins have full access
CREATE POLICY "Team: admin full access"
  ON public.organizer_team_members FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- CATEGORIES
-- ==========================================================================

-- Public can view active categories
CREATE POLICY "Categories: public read"
  ON public.categories FOR SELECT
  USING (is_active = true);

-- Admins have full access
CREATE POLICY "Categories: admin full access"
  ON public.categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- VENUES
-- ==========================================================================

-- Public can view active venues
CREATE POLICY "Venues: public read"
  ON public.venues FOR SELECT
  USING (is_active = true);

-- Admins have full access
CREATE POLICY "Venues: admin full access"
  ON public.venues FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- EVENTS
-- ==========================================================================

-- Public can view approved events
CREATE POLICY "Events: public read approved"
  ON public.events FOR SELECT
  USING (status = 'approved');

-- Organizers can view their own events (any status)
CREATE POLICY "Events: organizer read own"
  ON public.events FOR SELECT
  USING (public.is_event_organizer(id));

-- Organizers can create events
CREATE POLICY "Events: organizer create"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.is_organizer(organizer_id)
  );

-- Organizers can update their own events
CREATE POLICY "Events: organizer update own"
  ON public.events FOR UPDATE
  USING (public.is_event_organizer(id))
  WITH CHECK (public.is_event_organizer(id));

-- Organizers can delete their own draft/pending events
CREATE POLICY "Events: organizer delete own draft"
  ON public.events FOR DELETE
  USING (
    public.is_event_organizer(id)
    AND status IN ('draft', 'pending')
  );

-- Admins have full access
CREATE POLICY "Events: admin full access"
  ON public.events FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- TICKET TIERS
-- ==========================================================================

-- Public can view active ticket tiers for approved events
CREATE POLICY "Ticket tiers: public read"
  ON public.ticket_tiers FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE id = ticket_tiers.event_id AND status = 'approved'
    )
  );

-- Organizers can manage tiers for their events
CREATE POLICY "Ticket tiers: organizer manage"
  ON public.ticket_tiers FOR ALL
  USING (public.is_event_organizer(event_id))
  WITH CHECK (public.is_event_organizer(event_id));

-- Admins have full access
CREATE POLICY "Ticket tiers: admin full access"
  ON public.ticket_tiers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- REGISTRATIONS
-- ==========================================================================

-- Users can view their own registrations
CREATE POLICY "Registrations: own read"
  ON public.registrations FOR SELECT
  USING (user_id = auth.uid());

-- Organizers can view registrations for their events
CREATE POLICY "Registrations: organizer read"
  ON public.registrations FOR SELECT
  USING (public.is_event_organizer(event_id));

-- Authenticated users can create registrations
CREATE POLICY "Registrations: authenticated create"
  ON public.registrations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can cancel their own registrations
CREATE POLICY "Registrations: own cancel"
  ON public.registrations FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Organizers can update registrations for their events (check-in, etc.)
CREATE POLICY "Registrations: organizer update"
  ON public.registrations FOR UPDATE
  USING (public.is_event_organizer(event_id))
  WITH CHECK (public.is_event_organizer(event_id));

-- Admins have full access
CREATE POLICY "Registrations: admin full access"
  ON public.registrations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- TICKETS
-- ==========================================================================

-- Users can view their own tickets
CREATE POLICY "Tickets: own read"
  ON public.tickets FOR SELECT
  USING (user_id = auth.uid());

-- Organizers can view tickets for their events
CREATE POLICY "Tickets: organizer read"
  ON public.tickets FOR SELECT
  USING (public.is_event_organizer(event_id));

-- System can create tickets (via service role)
CREATE POLICY "Tickets: system create"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Organizers can update tickets for their events (mark as used)
CREATE POLICY "Tickets: organizer update"
  ON public.tickets FOR UPDATE
  USING (public.is_event_organizer(event_id))
  WITH CHECK (public.is_event_organizer(event_id));

-- Admins have full access
CREATE POLICY "Tickets: admin full access"
  ON public.tickets FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- PAYMENTS
-- ==========================================================================

-- Users can view their own payments
CREATE POLICY "Payments: own read"
  ON public.payments FOR SELECT
  USING (user_id = auth.uid());

-- Organizers can view payments for their events
CREATE POLICY "Payments: organizer read"
  ON public.payments FOR SELECT
  USING (public.is_event_organizer(event_id));

-- Authenticated users can create payments
CREATE POLICY "Payments: authenticated create"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Admins have full access
CREATE POLICY "Payments: admin full access"
  ON public.payments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- PAYOUTS
-- ==========================================================================

-- Organizers can view their own payouts
CREATE POLICY "Payouts: organizer read"
  ON public.payouts FOR SELECT
  USING (public.is_organizer(organizer_id));

-- Admins have full access
CREATE POLICY "Payouts: admin full access"
  ON public.payouts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- CONVERSATIONS
-- ==========================================================================

-- Participants can view their conversations
CREATE POLICY "Conversations: participant read"
  ON public.conversations FOR SELECT
  USING (auth.uid() = ANY(participant_ids));

-- Authenticated users can create conversations
CREATE POLICY "Conversations: authenticated create"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = ANY(participant_ids));

-- Participants can update their conversations
CREATE POLICY "Conversations: participant update"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = ANY(participant_ids))
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- Admins have full access
CREATE POLICY "Conversations: admin full access"
  ON public.conversations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- MESSAGES
-- ==========================================================================

-- Users can view messages in their conversations
CREATE POLICY "Messages: conversation participant read"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
        AND auth.uid() = ANY(participant_ids)
    )
  );

-- Authenticated users can send messages in their conversations
CREATE POLICY "Messages: participant create"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
        AND auth.uid() = ANY(participant_ids)
    )
  );

-- Admins have full access
CREATE POLICY "Messages: admin full access"
  ON public.messages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- REVIEWS
-- ==========================================================================

-- Public can view approved reviews
CREATE POLICY "Reviews: public read approved"
  ON public.reviews FOR SELECT
  USING (is_approved = true);

-- Users can view their own reviews
CREATE POLICY "Reviews: own read"
  ON public.reviews FOR SELECT
  USING (user_id = auth.uid());

-- Authenticated users can create reviews
CREATE POLICY "Reviews: authenticated create"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY "Reviews: own update"
  ON public.reviews FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins have full access
CREATE POLICY "Reviews: admin full access"
  ON public.reviews FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- SPONSORS
-- ==========================================================================

-- Public can view active sponsors for approved events
CREATE POLICY "Sponsors: public read"
  ON public.sponsors FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE id = sponsors.event_id AND status = 'approved'
    )
  );

-- Organizers can manage sponsors for their events
CREATE POLICY "Sponsors: organizer manage"
  ON public.sponsors FOR ALL
  USING (public.is_event_organizer(event_id))
  WITH CHECK (public.is_event_organizer(event_id));

-- Admins have full access
CREATE POLICY "Sponsors: admin full access"
  ON public.sponsors FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- NOTIFICATIONS
-- ==========================================================================

-- Users can view their own notifications
CREATE POLICY "Notifications: own read"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Notifications: own update"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can create notifications (via service role or triggers)
CREATE POLICY "Notifications: system create"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins have full access
CREATE POLICY "Notifications: admin full access"
  ON public.notifications FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- EVENT VIEWS
-- ==========================================================================

-- Public can create event views (anonymous tracking)
CREATE POLICY "Event views: public create"
  ON public.event_views FOR INSERT
  WITH CHECK (true);

-- Organizers can view analytics for their events
CREATE POLICY "Event views: organizer read"
  ON public.event_views FOR SELECT
  USING (public.is_event_organizer(event_id));

-- Admins have full access
CREATE POLICY "Event views: admin full access"
  ON public.event_views FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==========================================================================
-- AUDIT LOG
-- ==========================================================================

-- Admins can view all audit logs
CREATE POLICY "Audit log: admin read"
  ON public.audit_log FOR SELECT
  USING (public.is_admin());

-- System can create audit log entries
CREATE POLICY "Audit log: system create"
  ON public.audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ==========================================================================
-- PROMO CODES
-- ==========================================================================

-- Public can view active promo codes (for validation)
CREATE POLICY "Promo codes: public read active"
  ON public.promo_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at >= now()));

-- Organizers can manage their promo codes
CREATE POLICY "Promo codes: organizer manage"
  ON public.promo_codes FOR ALL
  USING (public.is_organizer(organizer_id))
  WITH CHECK (public.is_organizer(organizer_id));

-- Admins have full access
CREATE POLICY "Promo codes: admin full access"
  ON public.promo_codes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
