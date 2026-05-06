import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDailyLog, saveDailyLog as dbSaveLog, getStreak } from '@/services/database';
import { DailyLog } from '@/types';

export function useDailyLog(): {
  todayLog: DailyLog | null;
  todayLogged: boolean;
  streak: number;
  isLoading: boolean;
  error: string | null;
  saveLog: (log: Omit<DailyLog, 'id' | 'user_id' | 'date'>) => Promise<void>;
  refresh: () => Promise<void>;
} {
  const { user } = useAuth();
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayDate = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [log, currentStreak] = await Promise.all([
        getDailyLog(user.id, todayDate),
        getStreak(user.id),
      ]);
      setTodayLog(log);
      setStreak(currentStreak);
    } catch (err) {
      console.error('useDailyLog load error:', err);
      setError('Failed to load today\'s check-in.');
    } finally {
      setIsLoading(false);
    }
  }, [user, todayDate]);

  useEffect(() => {
    load();
  }, [load]);

  const saveLog = useCallback(
    async (logData: Omit<DailyLog, 'id' | 'user_id' | 'date'>) => {
      if (!user) throw new Error('No authenticated user');

      const fullLog: Omit<DailyLog, 'id'> = {
        ...logData,
        user_id: user.id,
        date: todayDate,
      };

      const saved = await dbSaveLog(fullLog);
      setTodayLog(saved);

      // Recompute streak after saving
      const newStreak = await getStreak(user.id);
      setStreak(newStreak);
    },
    [user, todayDate]
  );

  return {
    todayLog,
    todayLogged: todayLog !== null,
    streak,
    isLoading,
    error,
    saveLog,
    refresh: load,
  };
}
