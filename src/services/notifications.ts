import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { DailyLog, MedicationReminder, RecoverySnapshot } from '@/types';
import { supabase } from '@/services/supabase';

const ANDROID_CHANNEL = 'fibro-reminders';

function androidChannel() {
  return Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL } : {};
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Daily check-in reminder ─────────────────────────────────────────────────

export async function scheduleDailyCheckIn(timeString: string): Promise<void> {
  // Cancel existing before scheduling new
  await cancelNotification('daily-checkin');

  const [hourStr, minuteStr] = timeString.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(hour) || isNaN(minute)) return;

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-checkin',
    content: {
      title: 'Time for your daily check-in',
      body: "How are you feeling today? Take 60 seconds to log your symptoms.",
      sound: true,
      ...androidChannel(),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

// Cancels today's check-in and schedules a one-time trigger for tomorrow.
// Used after saving today's log so the reminder doesn't fire when already logged.
export async function scheduleDailyCheckInFromTomorrow(timeString: string): Promise<void> {
  await cancelNotification('daily-checkin');

  const [hourStr, minuteStr] = timeString.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hour, minute, 0, 0);

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-checkin',
    content: {
      title: 'Time for your daily check-in',
      body: "How are you feeling today? Take 60 seconds to log your symptoms.",
      sound: true,
      ...androidChannel(),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: tomorrow,
    },
  });
}

// ─── Cancel notifications by identifier prefix ────────────────────────────────

export async function cancelNotification(identifier: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matching = scheduled.filter((n) =>
    n.identifier.startsWith(identifier)
  );
  await Promise.all(
    matching.map((n) =>
      Notifications.cancelScheduledNotificationAsync(n.identifier)
    )
  );
}

// ─── Medication reminder ──────────────────────────────────────────────────────

export async function scheduleMedicationReminder(med: MedicationReminder): Promise<void> {
  if (!med.id) return;

  const identifier = `med-${med.id}`;
  await cancelNotification(identifier);

  if (!med.active) return;

  const [hourStr, minuteStr] = med.reminder_time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(hour) || isNaN(minute)) return;

  // For daily: fire every day. For other frequencies, schedule daily and let the
  // app handle skipping (expo-notifications doesn't support weekly/fortnightly
  // native triggers on all platforms without a custom approach).
  // We use a weekly trigger for weekly, and daily for others as a best effort.
  if (med.frequency === 'daily') {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `Time for ${med.name}`,
        body: `Don't forget your ${med.dose} dose of ${med.name}.`,
        sound: true,
        ...androidChannel(),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } else if (med.frequency === 'weekly') {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `Time for ${med.name}`,
        body: `Don't forget your ${med.dose} dose of ${med.name}.`,
        sound: true,
        ...androidChannel(),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 2, // Monday
        hour,
        minute,
      },
    });
  } else {
    // Fortnightly and monthly — schedule daily reminder; app can filter logic
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `Time for ${med.name}`,
        body: `Don't forget your ${med.dose} dose of ${med.name}.`,
        sound: true,
        ...androidChannel(),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

// ─── Flare early warning notification ────────────────────────────────────────

export async function sendFlareWarningIfNeeded(
  userId: string,
  level: 'watch' | 'warning'
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const key = `@fibro_flare_alert_${userId}_${today}`;

  const lastSent = await AsyncStorage.getItem(key);
  // Don't downgrade or repeat at the same level today
  if (lastSent === 'warning') return;
  if (lastSent === 'watch' && level === 'watch') return;

  const title = level === 'warning' ? '⚠️ Possible flare building' : '👀 Symptoms to watch';
  const body =
    level === 'warning'
      ? 'Several patterns suggest a flare may be building. Consider resting and reviewing your medications.'
      : 'A couple of signals suggest your body might be under stress. Keep a close eye on your symptoms.';

  await sendNudge(title, body);
  await AsyncStorage.setItem(key, level);
}

// ─── Nudge ────────────────────────────────────────────────────────────────────

export async function sendNudge(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true, ...androidChannel() },
    trigger: null, // fire immediately
  });
}

// ─── Nudge evaluation ─────────────────────────────────────────────────────────

export async function evaluateAndSendNudges(
  userId: string,
  logs: DailyLog[],
  recovery?: RecoverySnapshot | null
): Promise<void> {
  if (logs.length < 3) return;

  // Check max 1 nudge per day
  const todayCount = await getTodayNudgeCount(userId);
  if (todayCount > 0) return;

  const recent = logs.slice(-3); // last 3 days

  // Rule 1: 3+ days of over_2_hours morning stiffness → sleep nudge
  const poorSleepDays = recent.filter(
    (l) => l.stiffness_duration === 'over_2_hours'
  ).length;
  if (poorSleepDays >= 3) {
    const message =
      "Your sleep has been disrupted recently. An early night tonight might help.";
    await sendNudge('Sleep check', message);
    await saveNudgeToDb(userId, 'sleep', message);
    return;
  }

  // Rule 2: Pain rising 3+ consecutive days
  const last3Pain = recent.map((l) => l.pain_score);
  const painRising =
    last3Pain.length === 3 &&
    last3Pain[1] > last3Pain[0] &&
    last3Pain[2] > last3Pain[1];
  if (painRising) {
    const message =
      "Pain has been creeping up. How's your sleep and stress been?";
    await sendNudge('Pain check', message);
    await saveNudgeToDb(userId, 'pain_rising', message);
    return;
  }

  // Rule 3: Fatigue >= 7 for 3+ days
  const highFatigueDays = recent.filter((l) => l.fatigue_score >= 7).length;
  if (highFatigueDays >= 3) {
    const message =
      "Your energy has been low for a few days. Take it easy and get some rest.";
    await sendNudge('Energy check', message);
    await saveNudgeToDb(userId, 'fatigue', message);
    return;
  }

  // Rule 4: mood 'low' or 'very_low' for 3+ days
  const lowMoodDays = recent.filter(
    (l) => l.mood === 'low' || l.mood === 'very_low'
  ).length;
  if (lowMoodDays >= 3) {
    const message =
      "Things have been tough lately. Be kind to yourself. Even a short gentle walk can help.";
    await sendNudge('Mood check', message);
    await saveNudgeToDb(userId, 'mood', message);
    return;
  }

  // Rule 5: poor diet quality on 3 consecutive days
  const poorDietDays = recent.filter(
    (l) => l.diet_quality === 'poor' || l.diet_quality === 'mixed'
  ).length;
  if (poorDietDays >= 3) {
    const message =
      "Your diet has been more inflammatory this week. Processed, sugary, or trigger foods may worsen fibromyalgia symptoms. Even small changes help.";
    await sendNudge('Diet check', message);
    await saveNudgeToDb(userId, 'diet', message);
    return;
  }

  // Rule 6: alcohol logged 3+ of last 3 days
  const alcoholDays = recent.filter(
    (l) => (l.diet_triggers ?? []).includes('alcohol')
  ).length;
  if (alcoholDays >= 3) {
    const message =
      "You've logged alcohol several days running. Alcohol can worsen fibromyalgia symptoms and disrupt sleep. Your body might appreciate a break.";
    await sendNudge('Diet check', message);
    await saveNudgeToDb(userId, 'diet_alcohol', message);
    return;
  }

  // Rule 7: high activity 2+ of last 3 days — boom-bust pacing warning
  const highActivityDays = recent.filter((l) => l.activity_level === 'high').length;
  if (highActivityDays >= 2) {
    const message =
      "You've had a lot of high-activity days recently. Fibromyalgia often causes a delayed crash after exertion — consider building in a lighter day to stay ahead of it.";
    await sendNudge('Pacing check', message);
    await saveNudgeToDb(userId, 'pacing', message);
    return;
  }

  // Rule 8: high sensitivity 2+ of last 3 days — central sensitization signal
  const sensitivityDays = recent.filter((l) => l.high_sensitivity_day === true).length;
  if (sensitivityDays >= 2) {
    const message =
      "You've flagged high sensitivity over the past couple of days. Your nervous system may be overloaded — try reducing stimulation where you can and be gentle with yourself.";
    await sendNudge('Sensitivity check', message);
    await saveNudgeToDb(userId, 'sensitivity', message);
    return;
  }

  // Rule 9: unrefreshed sleep 3+ of last 3 days
  const unrefreshedDays = recent.filter((l) => l.woke_rested === false).length;
  if (unrefreshedDays >= 3) {
    const message =
      "You've woken unrefreshed for several mornings in a row. Non-restorative sleep is one of fibromyalgia's biggest drivers — it's worth reviewing your sleep habits or mentioning it to your doctor.";
    await sendNudge('Sleep quality check', message);
    await saveNudgeToDb(userId, 'unrefreshed_sleep', message);
    return;
  }

  // Rule 10: low overnight SpO₂ (from HealthKit)
  if (recovery?.oxygen_saturation !== null && recovery?.oxygen_saturation !== undefined) {
    if (recovery.oxygen_saturation < 94) {
      const message =
        `Your overnight SpO₂ was ${recovery.oxygen_saturation}% — lower than the normal range. Poor sleep oxygenation can worsen fibromyalgia pain and fatigue. It may be worth mentioning to your doctor.`;
      await sendNudge('Sleep oxygen check', message);
      await saveNudgeToDb(userId, 'low_spo2', message);
      return;
    }
  }

  // Rule 11: elevated sleep respiratory rate (from HealthKit)
  if (recovery?.respiratory_rate !== null && recovery?.respiratory_rate !== undefined) {
    if (recovery.respiratory_rate > 20) {
      const message =
        `Your respiratory rate during sleep was ${recovery.respiratory_rate} breaths/min — higher than normal. This can indicate your nervous system is under stress, which is common during fibromyalgia flares.`;
      await sendNudge('Recovery check', message);
      await saveNudgeToDb(userId, 'elevated_resp_rate', message);
      return;
    }
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function getTodayNudgeCount(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const { count, error } = await supabase
    .from('nudges')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('sent_at', `${today}T00:00:00.000Z`);

  if (error) return 0;
  return count ?? 0;
}

async function saveNudgeToDb(
  userId: string,
  triggerType: string,
  message: string
): Promise<void> {
  await supabase.from('nudges').insert({
    user_id: userId,
    sent_at: new Date().toISOString(),
    trigger_type: triggerType,
    message,
  });
}
