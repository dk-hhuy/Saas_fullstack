-- Study email reminders (C7)
-- Run in Supabase SQL Editor after 006-session-flashcards.sql

CREATE TABLE IF NOT EXISTS public.user_reminder_preferences (
  user_id varchar PRIMARY KEY,
  email text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  frequency text NOT NULL DEFAULT 'weekly'
    CHECK (frequency IN ('daily', 'weekly')),
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL,
  reminder_type text NOT NULL DEFAULT 'study_nudge',
  sent_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, reminder_type, sent_on)
);

CREATE INDEX IF NOT EXISTS idx_reminder_log_user_sent
  ON public.reminder_log(user_id, sent_on DESC);

ALTER TABLE public.user_reminder_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reminder_prefs_select_own" ON public.user_reminder_preferences;
CREATE POLICY "reminder_prefs_select_own" ON public.user_reminder_preferences
  FOR SELECT TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "reminder_prefs_upsert_own" ON public.user_reminder_preferences;
CREATE POLICY "reminder_prefs_upsert_own" ON public.user_reminder_preferences
  FOR ALL TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "reminder_log_select_own" ON public.reminder_log;
CREATE POLICY "reminder_log_select_own" ON public.reminder_log
  FOR SELECT TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'));

GRANT ALL ON TABLE public.user_reminder_preferences TO authenticated, service_role;
GRANT ALL ON TABLE public.reminder_log TO authenticated, service_role;
