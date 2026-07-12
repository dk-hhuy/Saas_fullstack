-- Expand session_locale to 5 languages (en, vi, es, zh, ja)
ALTER TABLE public.companions
  DROP CONSTRAINT IF EXISTS companions_session_locale_check;

ALTER TABLE public.companions
  ADD CONSTRAINT companions_session_locale_check
  CHECK (session_locale IN ('en', 'vi', 'es', 'zh', 'ja'));
