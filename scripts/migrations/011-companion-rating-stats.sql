-- P0: Denormalized rating stats on companions for SQL sort (popular / top_rated)

ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS average_rating numeric(3,1),
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_companions_public_rating
  ON public.companions (rating_count DESC, average_rating DESC NULLS LAST)
  WHERE is_public = true;

-- Backfill existing ratings
UPDATE public.companions c
SET
  rating_count = sub.cnt,
  average_rating = sub.avg
FROM (
  SELECT
    companion_id,
    COUNT(*)::integer AS cnt,
    ROUND(AVG(rating)::numeric, 1) AS avg
  FROM public.companion_ratings
  GROUP BY companion_id
) sub
WHERE c.id = sub.companion_id;

UPDATE public.companions
SET rating_count = 0, average_rating = NULL
WHERE id NOT IN (SELECT DISTINCT companion_id FROM public.companion_ratings);

CREATE OR REPLACE FUNCTION public.refresh_companion_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
  stats record;
BEGIN
  target_id := COALESCE(NEW.companion_id, OLD.companion_id);

  SELECT
    COUNT(*)::integer AS cnt,
    ROUND(AVG(rating)::numeric, 1) AS avg
  INTO stats
  FROM public.companion_ratings
  WHERE companion_id = target_id;

  UPDATE public.companions
  SET
    rating_count = COALESCE(stats.cnt, 0),
    average_rating = stats.avg
  WHERE id = target_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_companion_rating_stats ON public.companion_ratings;

CREATE TRIGGER trg_refresh_companion_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.companion_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_companion_rating_stats();
