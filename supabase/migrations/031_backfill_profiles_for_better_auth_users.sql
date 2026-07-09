-- Migration 031: Backfill profiles for existing better-auth users
-- Purpose: Every better-auth account must have a matching public.profiles row
-- (the domain identity table all FKs point at). The runtime sync previously
-- used an invalid `callbacks.onUserCreated` hook that never fired, so accounts
-- created before the fix (now `databaseHooks.user.create.after` in
-- apps/web/src/lib/auth/server.ts) are missing their profile. That gap caused:
--   • become-organizer FK violation 23503 (organizers_profile_id_fkey)
--   • /api/protected/profile → 404 ("Profile not found")
--
-- better-auth owns identity in its own public."user" table (see migration 017,
-- which already dropped profiles_id_fkey → auth.users and the auth trigger, so
-- profiles.id is a free UUID PK). This backfills one profile per orphaned user.
--
-- Idempotent: re-running is a no-op (LEFT JOIN + NOT EXISTS + ON CONFLICT).

INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id::uuid                                                              AS id,
  u.email                                                                AS email,
  COALESCE(NULLIF(u.full_name, ''), NULLIF(u.name, ''),
           split_part(u.email, '@', 1))                                  AS full_name,
  COALESCE(u.role, 'attendee')::public.user_role                         AS role
FROM "user" u
LEFT JOIN public.profiles p ON p.id = u.id::uuid
WHERE p.id IS NULL
  AND u.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles pe WHERE pe.email = u.email
  )
ON CONFLICT (id) DO NOTHING;
