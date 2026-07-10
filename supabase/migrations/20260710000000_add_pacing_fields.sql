-- Add fibromyalgia-specific pacing and daily quality fields to daily_logs
ALTER TABLE daily_logs
  ADD COLUMN IF NOT EXISTS activity_level text CHECK (activity_level IN ('low', 'moderate', 'high')),
  ADD COLUMN IF NOT EXISTS woke_rested boolean,
  ADD COLUMN IF NOT EXISTS high_sensitivity_day boolean;
