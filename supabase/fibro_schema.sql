-- ============================================================
-- Fibro — complete database schema
-- Safe to run on a fresh project (all statements are idempotent)
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- Project: pmeifcykstbiccdvvkwh
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TABLES
-- ────────────────────────────────────────────────────────────

-- Profiles (one per user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  age_range           text,
  diagnosis_years     text,
  severity            text,
  medications         text[] DEFAULT '{}',
  pain_locations      text[] DEFAULT '{}',
  pain_types          text[] DEFAULT '{}',
  conditions          text[] DEFAULT '{}',
  morning_stiffness   text,
  challenges          text[] DEFAULT '{}',
  notification_time   text DEFAULT '20:00',
  ai_context          text DEFAULT '',
  onboarding_complete boolean DEFAULT false,
  welcome_message     text,
  biological_sex      text,
  preferred_name      text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Daily logs
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date                date NOT NULL,
  pain_score          integer CHECK (pain_score >= 0 AND pain_score <= 10),
  fatigue_score       integer CHECK (fatigue_score >= 0 AND fatigue_score <= 10),
  brain_fog_score     integer CHECK (brain_fog_score IS NULL OR (brain_fog_score >= 0 AND brain_fog_score <= 10)),
  stiffness_duration  text,
  mood                text,
  notes               text DEFAULT '',
  medications_taken   text,
  exercise_done       boolean DEFAULT false,
  exercise_minutes    integer,
  exercise_type       text,
  period_active       boolean,
  diet_quality        text,
  diet_triggers       text[] DEFAULT '{}',
  created_at          timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Apple Health data
CREATE TABLE IF NOT EXISTS public.health_data (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date                date NOT NULL,
  steps               integer,
  sleep_duration      numeric(5,2),
  sleep_quality       numeric(3,1),
  hrv                 numeric(6,2),
  resting_heart_rate  numeric(5,1),
  active_calories     numeric(8,2),
  workouts            integer,
  created_at          timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Flares
CREATE TABLE IF NOT EXISTS public.flares (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date      date NOT NULL,
  end_date        date,
  severity        text,
  areas_affected  text[] DEFAULT '{}',
  triggers        text[] DEFAULT '{}',
  flare_type      text DEFAULT 'widespread',
  notes           text DEFAULT '',
  created_at      timestamptz DEFAULT now()
);

-- Nudges / smart notifications log
CREATE TABLE IF NOT EXISTS public.nudges (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sent_at      timestamptz DEFAULT now(),
  trigger_type text NOT NULL,
  message      text NOT NULL
);

-- Medication reminders
CREATE TABLE IF NOT EXISTS public.medications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name           text NOT NULL,
  dose           text,
  frequency      text NOT NULL,
  reminder_time  text,
  active         boolean DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

-- Biologic / injection log (for users on injectable treatments)
CREATE TABLE IF NOT EXISTS public.biologic_injections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medication_name text NOT NULL,
  injected_at     date NOT NULL,
  interval_days   integer NOT NULL DEFAULT 14,
  lot_number      text DEFAULT '',
  notes           text DEFAULT '',
  response_rating integer CHECK (response_rating IS NULL OR (response_rating BETWEEN 1 AND 5)),
  created_at      timestamptz DEFAULT now()
);

-- FIQ-R scores (Fibromyalgia Impact Questionnaire — Revised)
CREATE TABLE IF NOT EXISTS public.fiq_scores (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date           date NOT NULL,
  q_function     numeric(4,1) NOT NULL DEFAULT 0,
  q_work         numeric(4,1) NOT NULL DEFAULT 0,
  q_wellbeing    numeric(4,1) NOT NULL DEFAULT 0,
  q_pain         numeric(4,1) NOT NULL DEFAULT 0,
  q_fatigue      numeric(4,1) NOT NULL DEFAULT 0,
  q_rest         numeric(4,1) NOT NULL DEFAULT 0,
  q_stiffness    numeric(4,1) NOT NULL DEFAULT 0,
  q_anxiety      numeric(4,1) NOT NULL DEFAULT 0,
  q_depression   numeric(4,1) NOT NULL DEFAULT 0,
  q_memory       numeric(4,1) NOT NULL DEFAULT 0,
  score          numeric(5,2) NOT NULL DEFAULT 0,
  created_at     timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ────────────────────────────────────────────────────────────
-- ADD COLUMNS (safe if table already existed without them)
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.profiles      ADD COLUMN IF NOT EXISTS biological_sex  text;
ALTER TABLE public.profiles      ADD COLUMN IF NOT EXISTS preferred_name  text;
ALTER TABLE public.daily_logs    ADD COLUMN IF NOT EXISTS brain_fog_score integer CHECK (brain_fog_score IS NULL OR (brain_fog_score >= 0 AND brain_fog_score <= 10));
ALTER TABLE public.daily_logs    ADD COLUMN IF NOT EXISTS exercise_done   boolean DEFAULT false;
ALTER TABLE public.daily_logs    ADD COLUMN IF NOT EXISTS exercise_minutes integer;
ALTER TABLE public.daily_logs    ADD COLUMN IF NOT EXISTS exercise_type   text;
ALTER TABLE public.daily_logs    ADD COLUMN IF NOT EXISTS period_active   boolean;
ALTER TABLE public.daily_logs    ADD COLUMN IF NOT EXISTS diet_quality    text;
ALTER TABLE public.daily_logs    ADD COLUMN IF NOT EXISTS diet_triggers   text[] DEFAULT '{}';
ALTER TABLE public.flares        ADD COLUMN IF NOT EXISTS triggers        text[] DEFAULT '{}';
ALTER TABLE public.flares        ADD COLUMN IF NOT EXISTS flare_type      text DEFAULT 'widespread';

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_data        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flares             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biologic_injections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiq_scores         ENABLE ROW LEVEL SECURITY;

-- profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can view own profile') THEN
    CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can delete own profile') THEN
    CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- daily_logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_logs' AND policyname='Users can view own logs') THEN
    CREATE POLICY "Users can view own logs"   ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_logs' AND policyname='Users can insert own logs') THEN
    CREATE POLICY "Users can insert own logs" ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_logs' AND policyname='Users can update own logs') THEN
    CREATE POLICY "Users can update own logs" ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_logs' AND policyname='Users can delete own logs') THEN
    CREATE POLICY "Users can delete own logs" ON public.daily_logs FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- health_data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='health_data' AND policyname='Users can view own health data') THEN
    CREATE POLICY "Users can view own health data"   ON public.health_data FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='health_data' AND policyname='Users can insert own health data') THEN
    CREATE POLICY "Users can insert own health data" ON public.health_data FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='health_data' AND policyname='Users can update own health data') THEN
    CREATE POLICY "Users can update own health data" ON public.health_data FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='health_data' AND policyname='Users can delete own health data') THEN
    CREATE POLICY "Users can delete own health data" ON public.health_data FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- flares
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='flares' AND policyname='Users can view own flares') THEN
    CREATE POLICY "Users can view own flares"   ON public.flares FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='flares' AND policyname='Users can insert own flares') THEN
    CREATE POLICY "Users can insert own flares" ON public.flares FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='flares' AND policyname='Users can update own flares') THEN
    CREATE POLICY "Users can update own flares" ON public.flares FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='flares' AND policyname='Users can delete own flares') THEN
    CREATE POLICY "Users can delete own flares" ON public.flares FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- nudges
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nudges' AND policyname='Users can view own nudges') THEN
    CREATE POLICY "Users can view own nudges"   ON public.nudges FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nudges' AND policyname='Users can insert own nudges') THEN
    CREATE POLICY "Users can insert own nudges" ON public.nudges FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nudges' AND policyname='Users can delete own nudges') THEN
    CREATE POLICY "Users can delete own nudges" ON public.nudges FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- medications
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='medications' AND policyname='Users can view own medications') THEN
    CREATE POLICY "Users can view own medications"   ON public.medications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='medications' AND policyname='Users can insert own medications') THEN
    CREATE POLICY "Users can insert own medications" ON public.medications FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='medications' AND policyname='Users can update own medications') THEN
    CREATE POLICY "Users can update own medications" ON public.medications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='medications' AND policyname='Users can delete own medications') THEN
    CREATE POLICY "Users can delete own medications" ON public.medications FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- biologic_injections
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='biologic_injections' AND policyname='Users manage own biologic injections') THEN
    CREATE POLICY "Users manage own biologic injections" ON public.biologic_injections FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- fiq_scores
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fiq_scores' AND policyname='Users manage own fiq scores') THEN
    CREATE POLICY "Users manage own fiq scores" ON public.fiq_scores FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS daily_logs_user_date   ON public.daily_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS health_data_user_date  ON public.health_data(user_id, date DESC);
CREATE INDEX IF NOT EXISTS flares_user_start      ON public.flares(user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS nudges_user_sent        ON public.nudges(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS fiq_scores_user_date   ON public.fiq_scores(user_id, date DESC);

-- ────────────────────────────────────────────────────────────
-- TRIGGERS
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- AUTH: configure email redirect URL
-- (do this in Dashboard → Authentication → URL Configuration)
-- Allowed redirect URLs should include: fibro://
-- ────────────────────────────────────────────────────────────
