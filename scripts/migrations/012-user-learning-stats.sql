-- P0: Aggregate learning stats per user (My Journey analytics)

CREATE TABLE IF NOT EXISTS public.user_learning_stats (
  user_id varchar PRIMARY KEY,
  total_sessions integer NOT NULL DEFAULT 0,
  total_seconds integer NOT NULL DEFAULT 0,
  sessions_this_week integer NOT NULL DEFAULT 0,
  seconds_this_week integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  last_session_day date,
  last_session_at timestamptz,
  subject_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  week_start date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_learning_stats_updated
  ON public.user_learning_stats (updated_at DESC);

ALTER TABLE public.user_learning_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learning_stats_select_own" ON public.user_learning_stats;
CREATE POLICY "learning_stats_select_own" ON public.user_learning_stats
  FOR SELECT TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "learning_stats_upsert_own" ON public.user_learning_stats;
CREATE POLICY "learning_stats_upsert_own" ON public.user_learning_stats
  FOR ALL TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

GRANT ALL ON TABLE public.user_learning_stats TO authenticated, service_role;

-- Monthly usage aggregate (avoids loading all session rows in app)
CREATE OR REPLACE FUNCTION public.sum_session_duration_since(
  p_user_id text,
  p_since timestamptz
)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(duration_seconds), 0)::bigint
  FROM public.session_history
  WHERE user_id = p_user_id
    AND ended_at IS NOT NULL
    AND created_at >= p_since;
$$;

GRANT EXECUTE ON FUNCTION public.sum_session_duration_since(text, timestamptz) TO authenticated;
