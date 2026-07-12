-- P0: Composite indexes for session list, library, and monthly usage queries

CREATE INDEX IF NOT EXISTS idx_session_history_user_created
  ON public.session_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_history_user_ended
  ON public.session_history (user_id, ended_at DESC)
  WHERE ended_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companions_public_created
  ON public.companions (created_at DESC)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_session_history_user_month
  ON public.session_history (user_id, created_at)
  WHERE ended_at IS NOT NULL;
