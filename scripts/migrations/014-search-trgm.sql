-- P2: Trigram search indexes + reminder cron aggregate RPC

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_companions_name_trgm
  ON public.companions USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_companions_topic_trgm
  ON public.companions USING gin (topic gin_trgm_ops);

-- Fallback for reminder cron when user_learning_stats row is missing
CREATE OR REPLACE FUNCTION public.get_user_session_summaries(p_user_ids text[])
RETURNS TABLE (
  user_id text,
  total_sessions bigint,
  last_session_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sh.user_id,
    COUNT(*)::bigint AS total_sessions,
    MAX(COALESCE(sh.ended_at, sh.created_at)) AS last_session_at
  FROM public.session_history sh
  WHERE sh.user_id = ANY(p_user_ids)
    AND sh.ended_at IS NOT NULL
  GROUP BY sh.user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_session_summaries(text[]) TO service_role;
