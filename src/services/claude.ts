import { supabase } from '@/services/supabase';
import { OnboardingData, WelcomeContent } from '@/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Use raw fetch instead of supabase.functions.invoke to avoid Supabase's
// auth-aware wrapper triggering SIGNED_OUT when the Edge Function returns 401.
async function callClaude(body: object): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/claude-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Claude proxy error: ${response.status}`);
  const data = await response.json();
  if (!data?.text) throw new Error('No text in Claude proxy response');
  return data.text;
}

function buildOnboardingPrompt(data: OnboardingData, language?: string): string {
  const medicationLabels: Record<string, string> = {
    duloxetine: 'Duloxetine (Cymbalta)',
    pregabalin: 'Pregabalin (Lyrica)',
    milnacipran: 'Milnacipran (Savella)',
    amitriptyline: 'Amitriptyline (low dose)',
    low_dose_naltrexone: 'Low Dose Naltrexone (LDN)',
    nsaids_only: 'NSAIDs only',
    no_medication: 'no medication',
    other: 'other treatment',
  };

  const locationLabels: Record<string, string> = {
    lower_back: 'lower back',
    upper_back: 'upper back',
    hips: 'hips',
    knees: 'knees',
    shoulders: 'shoulders',
    neck: 'neck',
    chest: 'chest',
    jaw: 'jaw (TMJ)',
    hands_feet: 'hands and feet',
    widespread: 'widespread/all-over pain',
  };

  const conditionLabels: Record<string, string> = {
    sleep_disorder: 'sleep disorder',
    ibs: 'irritable bowel syndrome (IBS)',
    restless_legs: 'restless leg syndrome',
    headaches: 'chronic headaches/migraines',
    tmj: 'TMJ dysfunction',
    anxiety_depression: 'anxiety/depression',
    brain_fog: 'brain fog/cognitive issues',
    fatigue: 'significant fatigue',
  };

  const ageLabels: Record<string, string> = {
    under_25: 'under 25',
    '25_35': '25–35',
    '35_45': '35–45',
    '45_55': '45–55',
    '55_plus': '55+',
  };

  const diagnosisLabels: Record<string, string> = {
    not_diagnosed: 'not yet diagnosed (suspected fibromyalgia)',
    under_1: 'less than 1 year',
    '1_3': '1–3 years',
    '3_5': '3–5 years',
    '5_10': '5–10 years',
    '10_plus': 'more than 10 years',
  };

  const stiffnessLabels: Record<string, string> = {
    under_30: 'under 30 minutes',
    '30_60': '30–60 minutes',
    '1_2_hours': '1–2 hours',
    over_2_hours: 'more than 2 hours',
  };

  const sexLine = data.biological_sex && data.biological_sex !== 'prefer_not_to_say'
    ? `- Biological sex: ${data.biological_sex}${data.biological_sex === 'female' ? ' (note: fibromyalgia is more prevalent in females; hormonal fluctuations may significantly affect symptom severity and flare patterns)' : ''}\n`
    : '';

  const langInstruction = language && language !== 'en-GB' ? `\nRespond in ${language}. Write all text content in ${language} — JSON keys must remain in English.` : '';
  return `You are a warm, knowledgeable companion for someone living with fibromyalgia.${langInstruction}

Here is their profile:
${sexLine}- Age range: ${ageLabels[data.age_range ?? ''] ?? 'unknown'}
- Years since fibromyalgia diagnosis: ${diagnosisLabels[data.diagnosis_years ?? ''] ?? 'unknown'}
- Current disease activity: ${data.severity ?? 'unknown'}
- Current treatment: ${data.medications.map(m => medicationLabels[m] ?? m).join(', ') || 'none specified'}
- Pain locations: ${data.pain_locations.map(l => locationLabels[l] ?? l).join(', ') || 'none specified'}
- Pain types: ${data.pain_types.join(', ') || 'none specified'}
- Associated conditions: ${data.conditions.map(c => conditionLabels[c] ?? c).join(', ') || 'none'}
- Morning stiffness/pain duration: ${stiffnessLabels[data.morning_stiffness ?? ''] ?? 'unknown'}
- Biggest lifestyle challenges: ${data.challenges.join(', ') || 'none specified'}

Please respond with a JSON object with exactly this structure:
{
  "welcome_message": "A warm, personal 2-3 sentence welcome that acknowledges what they're going through specifically. Make them feel understood. Use 'you' and 'your'. Never use clinical language or anything alarming. Tone: like a knowledgeable friend who also has fibromyalgia.",
  "insights": [
    "First condition-specific insight relevant to their profile — something genuinely useful they might not know. 1-2 sentences.",
    "Second insight — different aspect of their profile. 1-2 sentences.",
    "Third insight — practical, actionable, warm. 1-2 sentences."
  ],
  "watch_summary": "1-2 sentences describing what Fibro will specifically monitor for this person based on their profile. Be specific to their conditions and challenges — e.g. sleep quality, brain fog patterns, pacing, flare triggers."
}

Rules:
- Never say "you are at risk", "you will flare", or anything that sounds like a diagnosis
- Always use language like "your data suggests", "might be worth", "consider"
- Be warm, not clinical
- Be specific to their actual profile — don't give generic fibromyalgia advice
- Key fibromyalgia factors: sleep quality, pacing/activity balance, stress, brain fog, weather sensitivity
- The JSON must be valid and parseable`;
}

export async function generateWelcomeContent(
  data: OnboardingData,
  language?: string
): Promise<WelcomeContent> {
  const prompt = buildOnboardingPrompt(data, language);

  const text = await callClaude({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Claude response');
  }

  return JSON.parse(jsonMatch[0]) as WelcomeContent;
}
