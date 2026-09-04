-- Migration 047: point_ledger — revoke default anon SELECT (defense-in-depth)
-- ---------------------------------------------------------------------------
-- Migration 028 grants anon SELECT on all public tables by default (RLS is the
-- gate). point_ledger is owner-scoped by RLS (profile_id = auth.uid()), so anon
-- already reads zero rows — but its sensitive siblings (referrals, wallet_passes,
-- feed_activities, ticket_transfers, registration_answers) each explicitly
-- REVOKE anon for parity. point_ledger missed that REVOKE in 041; add it here so
-- the private points ledger is not even table-reachable by anon.
REVOKE SELECT ON public.point_ledger FROM anon;
