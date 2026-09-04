-- ============================================================================
-- Migration 040: Collections & Curated Lists
-- Eventology V2.0 — HO-C (Collections)
-- ============================================================================
-- One `collections` table, two flavors: editorial (admin-created via the
-- service-role admin route, featured on discovery) and user "My Lists"
-- (public | unlisted | private, shareable by slug). `collection_items` is an
-- ordered, idempotent join (UNIQUE collection+event, explicit position).
--
-- RLS: everyone reads public/unlisted; owners read/write their own; private
-- is owner-only. Clients can NEVER set is_editorial/is_featured — the INSERT
-- policy forces is_editorial = false and the admin route uses the service
-- client (bypasses RLS) for editorial creation/featuring.
-- ============================================================================

CREATE TYPE public.collection_visibility AS ENUM ('public', 'unlisted', 'private');

CREATE TABLE public.collections (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description  TEXT,
  slug         TEXT NOT NULL UNIQUE,
  cover_url    TEXT,
  is_editorial BOOLEAN NOT NULL DEFAULT false,
  is_featured  BOOLEAN NOT NULL DEFAULT false,
  visibility   public.collection_visibility NOT NULL DEFAULT 'private',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_collections_owner ON public.collections(owner_id, updated_at DESC);
CREATE INDEX idx_collections_featured ON public.collections(is_featured, updated_at DESC) WHERE is_editorial;

CREATE TABLE public.collection_items (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (collection_id, event_id)
);
CREATE INDEX idx_collection_items ON public.collection_items(collection_id, position);

CREATE TRIGGER trg_collections_updated BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "col_select_visible" ON public.collections FOR SELECT
  USING (visibility IN ('public','unlisted') OR owner_id = auth.uid());
CREATE POLICY "col_insert_own" ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND is_editorial = false);
CREATE POLICY "col_update_own" ON public.collections FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "col_delete_own" ON public.collections FOR DELETE USING (owner_id = auth.uid());
-- Editorial create/feature is admin-only via a service-role admin route
-- (/api/protected/admin/collections), NOT client policy.

CREATE POLICY "ci_select_visible" ON public.collection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id
          AND (c.visibility IN ('public','unlisted') OR c.owner_id = auth.uid())));
CREATE POLICY "ci_write_own" ON public.collection_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = auth.uid()))
  WITH CHECK (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = auth.uid()));

GRANT SELECT ON public.collections, public.collection_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.collections, public.collection_items TO authenticated;
