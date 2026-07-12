-- Session flashcards (C2)
-- Run in Supabase SQL Editor after 005-companion-ratings.sql

ALTER TABLE public.session_history
  ADD COLUMN IF NOT EXISTS flashcards jsonb;
