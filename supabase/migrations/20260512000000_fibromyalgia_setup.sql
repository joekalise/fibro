-- FIQ scores (replaces BASDAI)
CREATE TABLE IF NOT EXISTS fiq_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  q_function numeric(4,1) NOT NULL DEFAULT 0,
  q_work numeric(4,1) NOT NULL DEFAULT 0,
  q_wellbeing numeric(4,1) NOT NULL DEFAULT 0,
  q_pain numeric(4,1) NOT NULL DEFAULT 0,
  q_fatigue numeric(4,1) NOT NULL DEFAULT 0,
  q_rest numeric(4,1) NOT NULL DEFAULT 0,
  q_stiffness numeric(4,1) NOT NULL DEFAULT 0,
  q_anxiety numeric(4,1) NOT NULL DEFAULT 0,
  q_depression numeric(4,1) NOT NULL DEFAULT 0,
  q_memory numeric(4,1) NOT NULL DEFAULT 0,
  score numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE fiq_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own fiq scores" ON fiq_scores FOR ALL USING (auth.uid() = user_id);

-- Exercise tracking on daily logs
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS exercise_done boolean DEFAULT false;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS exercise_minutes integer;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS exercise_type text;
