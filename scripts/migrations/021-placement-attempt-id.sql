-- Idempotent placement saves (retry after transient failure)
-- Run in Supabase SQL Editor after migration 019

ALTER TABLE public.placement_assessments
  ADD COLUMN IF NOT EXISTS attempt_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS idx_placement_assessments_attempt_id
  ON public.placement_assessments (user_id, attempt_id)
  WHERE attempt_id IS NOT NULL;
