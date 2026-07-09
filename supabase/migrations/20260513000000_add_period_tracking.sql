ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS biological_sex text;

ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS period_active boolean;
