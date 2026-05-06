import { supabase } from '@/services/supabase';
import { DailyLog, Flare, FlareSeverity, HealthData, MedicationReminder, PainLocation } from '@/types';

// ─── Daily Logs ─────────────────────────────────────────────────────────────

export async function saveDailyLog(log: Omit<DailyLog, 'id'>): Promise<DailyLog> {
  try {
    const { data, error } = await supabase
      .from('daily_logs')
      .upsert(log, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error) throw error;
    return data as DailyLog;
  } catch (err) {
    console.error('saveDailyLog error:', err);
    throw err;
  }
}

export async function getDailyLog(userId: string, date: string): Promise<DailyLog | null> {
  try {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as DailyLog;
  } catch (err) {
    console.error('getDailyLog error:', err);
    throw err;
  }
}

export async function getDailyLogs(userId: string, days: number): Promise<DailyLog[]> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    const sinceDate = since.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', sinceDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return (data ?? []) as DailyLog[];
  } catch (err) {
    console.error('getDailyLogs error:', err);
    throw err;
  }
}

// ─── Flares ──────────────────────────────────────────────────────────────────

export async function startFlare(flare: Omit<Flare, 'id' | 'end_date'>): Promise<Flare> {
  try {
    const payload = { ...flare, end_date: null };
    const { data, error } = await supabase
      .from('flares')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Flare;
  } catch (err) {
    console.error('startFlare error:', err);
    throw err;
  }
}

export async function endFlare(flareId: string, endDate: string): Promise<Flare> {
  try {
    const { data, error } = await supabase
      .from('flares')
      .update({ end_date: endDate })
      .eq('id', flareId)
      .select()
      .single();

    if (error) throw error;
    return data as Flare;
  } catch (err) {
    console.error('endFlare error:', err);
    throw err;
  }
}

export async function updateFlare(flareId: string, updates: Partial<Flare>): Promise<Flare> {
  try {
    const { data, error } = await supabase
      .from('flares')
      .update(updates)
      .eq('id', flareId)
      .select()
      .single();

    if (error) throw error;
    return data as Flare;
  } catch (err) {
    console.error('updateFlare error:', err);
    throw err;
  }
}

export async function getFlares(userId: string): Promise<Flare[]> {
  try {
    const { data, error } = await supabase
      .from('flares')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Flare[];
  } catch (err) {
    console.error('getFlares error:', err);
    throw err;
  }
}

export async function getActiveFlare(userId: string): Promise<Flare | null> {
  try {
    const { data, error } = await supabase
      .from('flares')
      .select('*')
      .eq('user_id', userId)
      .is('end_date', null)
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as Flare;
  } catch (err) {
    console.error('getActiveFlare error:', err);
    throw err;
  }
}

// ─── Medications ─────────────────────────────────────────────────────────────

export async function getMedications(userId: string): Promise<MedicationReminder[]> {
  try {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as MedicationReminder[];
  } catch (err) {
    console.error('getMedications error:', err);
    throw err;
  }
}

export async function addMedication(
  med: Omit<MedicationReminder, 'id'>
): Promise<MedicationReminder> {
  try {
    const { data, error } = await supabase
      .from('medications')
      .insert(med)
      .select()
      .single();

    if (error) throw error;
    return data as MedicationReminder;
  } catch (err) {
    console.error('addMedication error:', err);
    throw err;
  }
}

export async function updateMedication(
  id: string,
  updates: Partial<MedicationReminder>
): Promise<MedicationReminder> {
  try {
    const { data, error } = await supabase
      .from('medications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MedicationReminder;
  } catch (err) {
    console.error('updateMedication error:', err);
    throw err;
  }
}

export async function deleteMedication(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('medications').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('deleteMedication error:', err);
    throw err;
  }
}

// ─── Nudges ───────────────────────────────────────────────────────────────────

export async function getTodayNudgeCount(userId: string): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase
      .from('nudges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('sent_at', `${today}T00:00:00.000Z`);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function saveNudge(
  userId: string,
  triggerType: string,
  message: string
): Promise<void> {
  try {
    const { error } = await supabase.from('nudges').insert({
      user_id: userId,
      sent_at: new Date().toISOString(),
      trigger_type: triggerType,
      message,
    });
    if (error) throw error;
  } catch (err) {
    console.error('saveNudge error:', err);
    throw err;
  }
}

// ─── Health Data ──────────────────────────────────────────────────────────────

export async function saveHealthData(data: Omit<HealthData, 'id'>): Promise<HealthData> {
  try {
    const { data: result, error } = await supabase
      .from('health_data')
      .upsert(data, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error) throw error;
    return result as HealthData;
  } catch (err) {
    console.error('saveHealthData error:', err);
    throw err;
  }
}

export async function getTodayHealthData(
  userId: string,
  date: string
): Promise<HealthData | null> {
  try {
    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as HealthData;
  } catch (err) {
    console.error('getTodayHealthData error:', err);
    return null;
  }
}

export async function getHealthDataRange(
  userId: string,
  days: number
): Promise<HealthData[]> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    const sinceDate = since.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', userId)
      .gte('date', sinceDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return (data ?? []) as HealthData[];
  } catch (err) {
    console.error('getHealthDataRange error:', err);
    return [];
  }
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export async function getStreak(userId: string): Promise<number> {
  try {
    // Fetch the last 90 days to count consecutive days with logs
    const { data, error } = await supabase
      .from('daily_logs')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(90);

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    const loggedDates = new Set<string>(data.map((d: { date: string }) => d.date));

    let streak = 0;
    const today = new Date();

    // Start counting from today (if logged) or yesterday
    const todayStr = today.toISOString().split('T')[0];
    const cursor = new Date(today);

    // If today isn't logged yet, start from yesterday
    if (!loggedDates.has(todayStr)) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (true) {
      const dateStr = cursor.toISOString().split('T')[0];
      if (!loggedDates.has(dateStr)) break;
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  } catch (err) {
    console.error('getStreak error:', err);
    return 0;
  }
}
