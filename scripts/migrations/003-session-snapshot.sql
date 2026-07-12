-- Session companion snapshot (preserve name/topic/subject when companion is private or deleted)
-- Run in Supabase SQL Editor after 002-session-summary.sql

ALTER TABLE public.session_history
  ADD COLUMN IF NOT EXISTS companion_name text,
  ADD COLUMN IF NOT EXISTS companion_topic text,
  ADD COLUMN IF NOT EXISTS companion_subject text;
