-- Session summary + quiz (Phase A)
-- Run in Supabase SQL Editor after 001-feature-pack.sql

ALTER TABLE public.session_history
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS quiz jsonb;
