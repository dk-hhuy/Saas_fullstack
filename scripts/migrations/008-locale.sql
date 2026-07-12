-- Session language for voice tutoring (C3)
ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS session_locale text NOT NULL DEFAULT 'en';

ALTER TABLE public.companions
  DROP CONSTRAINT IF EXISTS companions_session_locale_check;

ALTER TABLE public.companions
  ADD CONSTRAINT companions_session_locale_check
  CHECK (session_locale IN ('en', 'vi'));
