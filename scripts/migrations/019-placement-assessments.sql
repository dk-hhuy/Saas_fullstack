-- Placement tests (Assessment hub)
-- Run in Supabase SQL Editor after prior migrations

CREATE TABLE IF NOT EXISTS public.placement_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL,
  subject varchar NOT NULL,
  topic varchar,
  questions jsonb NOT NULL,
  answers jsonb,
  score integer,
  total integer NOT NULL,
  recommended_level varchar NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_placement_assessments_user_created
  ON public.placement_assessments (user_id, created_at DESC);

ALTER TABLE public.placement_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "placement_assessments_own" ON public.placement_assessments;
CREATE POLICY "placement_assessments_own" ON public.placement_assessments
  FOR ALL TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

GRANT ALL ON TABLE public.placement_assessments TO authenticated, service_role;
