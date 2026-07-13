-- Lightweight session quiz hub (avoids loading full quiz JSONB in list views)
-- Run in Supabase SQL Editor after 019-placement-assessments.sql

CREATE OR REPLACE FUNCTION public.get_session_quiz_hub(p_limit integer DEFAULT 30)
RETURNS TABLE (
  session_id uuid,
  companion_name text,
  companion_topic text,
  companion_subject text,
  question_count integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    sh.id,
    sh.companion_name,
    sh.companion_topic,
    sh.companion_subject,
    jsonb_array_length(sh.quiz)::integer,
    sh.created_at
  FROM public.session_history sh
  WHERE sh.user_id = (auth.jwt() ->> 'sub')
    AND sh.quiz IS NOT NULL
    AND jsonb_array_length(sh.quiz) > 0
  ORDER BY sh.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION public.get_session_quiz_hub(integer) TO authenticated, service_role;
