-- ============================================================================
-- Migration 045: Wallet Passes (Apple + Google) — STUBBED SEAM
-- Eventology V2.0 — HO-H (Wallet)
-- ============================================================================
-- wallet_passes records issued passes (ticket, platform, serial) so they can
-- be revoked/rotated. SELECT is owner-only; issuance/rotation happens via the
-- server routes with SERVICE context (schema comment: "no client write
-- policy") — hence SELECT grant for authenticated, ALL for service_role.
--
-- REVOCATION ON TRANSFER (HO-G): both transfer fns move ownership with
-- `UPDATE tickets SET user_id = ...`. This trigger revokes the ticket's
-- passes on exactly that transition, catching every transfer path (direct,
-- accept route, signup databaseHook). The next owner requesting a pass gets
-- a fresh serial via the route's get-or-reissue logic.
--
-- No live Apple/Google keys in V2.0: the payload is produced by the stubbed
-- packages/wallet seam (WALLET_PROVIDER=stub).
-- ============================================================================

CREATE TABLE public.wallet_passes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id   UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL CHECK (platform IN ('apple', 'google')),
  serial      TEXT NOT NULL UNIQUE,
  revoked     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ticket_id, platform)
);

ALTER TABLE public.wallet_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wp_select_own" ON public.wallet_passes FOR SELECT
  USING (profile_id = auth.uid());
GRANT SELECT ON public.wallet_passes TO authenticated;
-- Issued/revoked via server route with service context; no client write policy.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_passes TO service_role;

-- Hardening (mirrors 036/037): 028 default privileges auto-grant anon SELECT
-- on every new table. Passes are owner-private → revoke explicitly.
REVOKE ALL ON public.wallet_passes FROM anon;

-- ---------------------------------------------------------------------------
-- Revocation on ownership transfer (HO-G integration)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_revoke_wallet_passes_on_transfer()
  RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.wallet_passes
    SET revoked = true
    WHERE ticket_id = NEW.id AND revoked = false;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_revoke_wallet_passes_transfer
  AFTER UPDATE OF user_id ON public.tickets
  FOR EACH ROW
  WHEN (NEW.user_id <> OLD.user_id)
  EXECUTE FUNCTION public.fn_revoke_wallet_passes_on_transfer();
