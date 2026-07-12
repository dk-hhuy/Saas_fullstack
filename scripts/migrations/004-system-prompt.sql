-- Custom system prompt per companion (C9)
-- Run in Supabase SQL Editor after 003-session-snapshot.sql

ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS system_prompt text;
