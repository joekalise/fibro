ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS brain_fog_score integer CHECK (brain_fog_score IS NULL OR (brain_fog_score >= 0 AND brain_fog_score <= 10));

ALTER TABLE public.flares
  ADD COLUMN IF NOT EXISTS triggers text[] DEFAULT '{}';

ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS diet_quality text;

ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS diet_triggers text[] DEFAULT '{}';
