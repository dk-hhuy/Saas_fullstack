-- Companion ratings (C4)
-- Run in Supabase SQL Editor after 004-system-prompt.sql

CREATE TABLE IF NOT EXISTS public.companion_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id varchar NOT NULL,
  companion_id uuid NOT NULL REFERENCES public.companions(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  UNIQUE (user_id, companion_id)
);

CREATE INDEX IF NOT EXISTS idx_companion_ratings_companion
  ON public.companion_ratings(companion_id);

ALTER TABLE public.companion_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ratings_select_all" ON public.companion_ratings;
CREATE POLICY "ratings_select_all" ON public.companion_ratings
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "ratings_upsert_own" ON public.companion_ratings;
CREATE POLICY "ratings_upsert_own" ON public.companion_ratings
  FOR ALL TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

GRANT ALL ON TABLE public.companion_ratings TO authenticated, service_role;
