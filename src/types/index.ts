export type AgeRange = 'under_25' | '25_35' | '35_45' | '45_55' | '55_plus';
export type BiologicalSex = 'male' | 'female' | 'prefer_not_to_say';
export type DiagnosisYears = 'not_diagnosed' | 'under_1' | '1_3' | '3_5' | '5_10' | '10_plus';
export type Severity = 'mild' | 'moderate' | 'severe';
export type Medication =
  | 'duloxetine'
  | 'pregabalin'
  | 'milnacipran'
  | 'amitriptyline'
  | 'low_dose_naltrexone'
  | 'nsaids_only'
  | 'no_medication'
  | 'other';
export type PainLocation =
  | 'lower_back'
  | 'upper_back'
  | 'hips'
  | 'knees'
  | 'shoulders'
  | 'neck'
  | 'chest'
  | 'jaw'
  | 'hands_feet'
  | 'widespread'
  | 'other';
export type PainType = 'stiffness' | 'sharp_pain' | 'burning' | 'aching' | 'tingling' | 'hypersensitivity' | 'fatigue';
export type AssociatedCondition =
  | 'sleep_disorder'
  | 'ibs'
  | 'restless_legs'
  | 'headaches'
  | 'tmj'
  | 'anxiety_depression'
  | 'brain_fog'
  | 'fatigue';

export type FlareType = 'widespread' | 'localized' | 'fatigue_dominant';
export type FlareTrigger = 'stress' | 'poor_sleep' | 'overactivity' | 'weather_changes' | 'illness' | 'hormonal_changes' | 'dietary' | 'unknown';
export type MorningStiffness = 'none' | 'under_30' | '30_60' | '1_2_hours' | 'over_2_hours';
export type LifestyleChallenge =
  | 'sleep'
  | 'exercise'
  | 'work'
  | 'social_life'
  | 'mental_health';
export type Mood = 'great' | 'good' | 'okay' | 'low' | 'very_low';
export type FlareSeverity = 'mild' | 'moderate' | 'severe';
export type DietQuality = 'clean' | 'mostly_clean' | 'mixed' | 'poor';
export type DietTrigger =
  | 'alcohol'
  | 'processed'
  | 'high_sugar'
  | 'high_starch'
  | 'dairy'
  | 'red_meat'
  | 'nightshades';

export interface UserProfile {
  id?: string;
  user_id: string;
  biological_sex?: BiologicalSex | null;
  age_range: AgeRange | null;
  diagnosis_years: DiagnosisYears | null;
  severity: Severity | null;
  medications: Medication[];
  pain_locations: PainLocation[];
  pain_types: PainType[];
  conditions: AssociatedCondition[];
  morning_stiffness: MorningStiffness | null;
  challenges: LifestyleChallenge[];
  notification_time: string;
  ai_context: string;
  onboarding_complete: boolean;
  welcome_message?: string;
  preferred_name?: string | null;
}

export interface DailyLog {
  id?: string;
  user_id: string;
  date: string;
  pain_score: number;
  fatigue_score: number;
  brain_fog_score: number | null;
  stiffness_duration: MorningStiffness | null;
  mood: Mood | null;
  notes: string;
  medications_taken: 'yes' | 'no' | 'partial';
  diet_quality: DietQuality | null;
  diet_triggers: DietTrigger[] | null;
  exercise_done: boolean;
  exercise_minutes: number | null;
  exercise_type: string | null;
  period_active?: boolean | null;
}

export interface HealthData {
  id?: string;
  user_id: string;
  date: string;
  steps: number | null;
  sleep_duration: number | null;
  sleep_quality: number | null;
  hrv: number | null;
  resting_heart_rate: number | null;
  active_calories: number | null;
  workouts: number | null;
}

export interface Flare {
  id?: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  severity: FlareSeverity;
  areas_affected: string[];
  triggers: FlareTrigger[];
  notes: string;
  flare_type?: FlareType;
}

export interface Nudge {
  id?: string;
  user_id: string;
  sent_at: string;
  trigger_type: string;
  message: string;
}

export interface MedicationReminder {
  id?: string;
  user_id: string;
  name: string;
  dose: string;
  frequency: 'daily' | 'weekly' | 'fortnightly' | 'monthly';
  reminder_time: string;
  active: boolean;
}

export interface OnboardingData {
  biological_sex: BiologicalSex | null;
  age_range: AgeRange | null;
  diagnosis_years: DiagnosisYears | null;
  severity: Severity | null;
  medications: Medication[];
  pain_locations: PainLocation[];
  pain_types: PainType[];
  conditions: AssociatedCondition[];
  morning_stiffness: MorningStiffness | null;
  challenges: LifestyleChallenge[];
  notification_time: string;
}

export interface WelcomeContent {
  welcome_message: string;
  insights: string[];
  watch_summary: string;
}

export interface FiqScore {
  id?: string;
  user_id: string;
  date: string;
  q_function: number;
  q_work: number;
  q_wellbeing: number;
  q_pain: number;
  q_fatigue: number;
  q_rest: number;
  q_stiffness: number;
  q_anxiety: number;
  q_depression: number;
  q_memory: number;
  score: number;
}
