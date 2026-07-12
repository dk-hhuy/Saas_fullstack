-- C5: Companion marketplace (featured, tags, moderation, reports)

ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS marketplace_status text NOT NULL DEFAULT 'none'
    CHECK (marketplace_status IN ('none', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS clone_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_companions_marketplace_approved
  ON public.companions (created_at DESC)
  WHERE is_public = true AND marketplace_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_companions_featured
  ON public.companions (created_at DESC)
  WHERE is_public = true AND featured = true AND marketplace_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_companions_tags
  ON public.companions USING gin (tags);

CREATE INDEX IF NOT EXISTS idx_companions_clone_count
  ON public.companions (clone_count DESC)
  WHERE is_public = true AND marketplace_status = 'approved';

-- Existing public companions count as marketplace-approved
UPDATE public.companions
SET marketplace_status = 'approved'
WHERE is_public = true AND marketplace_status = 'none';

CREATE TABLE IF NOT EXISTS public.companion_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id varchar NOT NULL,
  companion_id uuid NOT NULL REFERENCES public.companions(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companion_reports_companion
  ON public.companion_reports (companion_id, created_at DESC);

ALTER TABLE public.companion_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companion_reports_insert" ON public.companion_reports;
CREATE POLICY "companion_reports_insert" ON public.companion_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "companion_reports_select_own" ON public.companion_reports;
CREATE POLICY "companion_reports_select_own" ON public.companion_reports
  FOR SELECT TO authenticated
  USING (reporter_id = (auth.jwt() ->> 'sub'));

GRANT ALL ON TABLE public.companion_reports TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.increment_companion_clone_count(p_companion_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.companions
  SET clone_count = clone_count + 1
  WHERE id = p_companion_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_companion_clone_count(uuid) TO authenticated;
