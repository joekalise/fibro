import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HealthData } from '@/types';
import {
  isHealthKitAvailable,
  isHealthConnected,
  requestHealthPermissions,
  fetchTodayHealthData,
  disconnectHealth,
  HealthSnapshot,
} from '@/services/healthKit';
import { saveHealthData, getTodayHealthData } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

const healthCacheKey = (date: string) => `@fibro_health_cache_${date}`;

export interface UseHealthDataResult {
  isAvailable: boolean;
  isConnected: boolean;
  isLoading: boolean;
  todayData: HealthSnapshot | null;
  connect: () => Promise<boolean>;
  sync: () => Promise<void>;
  disconnect: () => Promise<void>;
  recheck: () => Promise<void>;
}

export function useHealthData(): UseHealthDataResult {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [todayData, setTodayData] = useState<HealthSnapshot | null>(null);

  // Load local cache immediately — no auth dependency, shows data before user resolves
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    AsyncStorage.getItem(healthCacheKey(today))
      .then((raw) => {
        if (raw) {
          setTodayData(JSON.parse(raw) as HealthSnapshot);
          setIsConnected(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      try {
        const available = await isHealthKitAvailable();
        if (cancelled) return;
        setIsAvailable(available);

        const connected = await isHealthConnected();
        if (cancelled) return;
        setIsConnected(connected);

        if (!available || !connected || !user) return;

        const today = new Date().toISOString().split('T')[0];

        // Fast path: load from Supabase first
        try {
          const cached = await getTodayHealthData(user.id, today);
          if (cached && !cancelled) setTodayData(cached);
        } catch {}

        // Fresh path: pull from HealthKit then persist
        try {
          const fresh = await fetchTodayHealthData(user.id, today);
          if (cancelled) return;
          const hasData = Object.entries(fresh).some(
            ([k, v]) => k !== 'user_id' && k !== 'date' && v !== null
          );
          if (hasData) {
            setTodayData(fresh);
            await saveHealthData(fresh as Omit<HealthData, 'id'>);
            AsyncStorage.setItem(healthCacheKey(today), JSON.stringify(fresh)).catch(() => {});
          }
        } catch {}
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [user]);

  const sync = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const fresh = await fetchTodayHealthData(user.id, today);
      const hasData = Object.entries(fresh).some(
        ([k, v]) => k !== 'user_id' && k !== 'date' && v !== null
      );
      if (hasData) {
        setTodayData(fresh);
        await saveHealthData(fresh as Omit<HealthData, 'id'>);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const connect = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const granted = await requestHealthPermissions();
      if (granted) {
        setIsConnected(true);
        await sync();
      }
      return granted;
    } catch (e) {
      Alert.alert('HealthKit Error', String(e));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sync]);

  const disconnect = useCallback(async () => {
    await disconnectHealth();
    setIsConnected(false);
    setTodayData(null);
    const today = new Date().toISOString().split('T')[0];
    AsyncStorage.removeItem(healthCacheKey(today)).catch(() => {});
  }, []);

  const recheck = useCallback(async () => {
    const connected = await isHealthConnected();
    if (!connected) {
      setIsConnected(false);
      setTodayData(null);
    }
  }, []);

  return { isAvailable, isConnected, isLoading, todayData, connect, sync, disconnect, recheck };
}
