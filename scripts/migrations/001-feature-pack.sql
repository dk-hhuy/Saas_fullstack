-- Feature pack migration: is_public, bookmarks, session transcript
-- Run in Supabase SQL Editor after supabase-restore-public.sql (or on existing project)

-- 1. Public/Private companion
ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Existing seed data: keep visible in library
UPDATE public.companions SET is_public = true WHERE is_public = false;

-- 2. Session transcript fields
ALTER TABLE public.session_history
  ADD COLUMN IF NOT EXISTS transcript jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz;

-- 3. Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id varchar NOT NULL,
  companion_id uuid NOT NULL REFERENCES public.companions(id) ON DELETE CASCADE,
  UNIQUE (user_id, companion_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companions_author ON public.companions(author);
CREATE INDEX IF NOT EXISTS idx_companions_is_public ON public.companions(is_public);
CREATE INDEX IF NOT EXISTS idx_session_history_user_id ON public.session_history(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);

-- Drop legacy broad policies
DROP POLICY IF EXISTS "All" ON public.companions;
DROP POLICY IF EXISTS "All" ON public.session_history;
DROP POLICY IF EXISTS "Clerk" ON public.companions;
DROP POLICY IF EXISTS "Clerk" ON public.session_history;

-- Companions RLS
CREATE POLICY "companions_select" ON public.companions
  FOR SELECT TO authenticated, anon
  USING (
    is_public = true
    OR author = (auth.jwt() ->> 'sub')
  );

CREATE POLICY "companions_insert" ON public.companions
  FOR INSERT TO authenticated
  WITH CHECK (author = (auth.jwt() ->> 'sub'));

CREATE POLICY "companions_update" ON public.companions
  FOR UPDATE TO authenticated
  USING (author = (auth.jwt() ->> 'sub'))
  WITH CHECK (author = (auth.jwt() ->> 'sub'));

CREATE POLICY "companions_delete" ON public.companions
  FOR DELETE TO authenticated
  USING (author = (auth.jwt() ->> 'sub'));

-- Session history RLS (own sessions only for authenticated)
CREATE POLICY "sessions_select_own" ON public.session_history
  FOR SELECT TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "sessions_insert_own" ON public.session_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "sessions_update_own" ON public.session_history
  FOR UPDATE TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- Bookmarks RLS
DROP POLICY IF EXISTS "bookmarks_all_own" ON public.bookmarks;
CREATE POLICY "bookmarks_all_own" ON public.bookmarks
  FOR ALL TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

GRANT ALL ON TABLE public.bookmarks TO authenticated, service_role;
