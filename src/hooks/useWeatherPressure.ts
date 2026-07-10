import { useState, useEffect, useCallback } from 'react';
import {
  getLocationPermissionStatus,
  requestLocationPermission,
  fetchPressure,
  getCachedPressure,
  PressureData,
} from '@/services/weather';

export function useWeatherPressure() {
  const [pressure, setPressure] = useState<PressureData | null>(null);
  // Start as 'undetermined' — we check asynchronously, but don't call
  // expo-location on mount. We only load cached pressure from AsyncStorage,
  // which is safe and doesn't touch native location modules.
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      // Load any cached pressure first (AsyncStorage only — no native calls)
      const cached = await getCachedPressure();
      if (!cancelled) setPressure(cached);

      // Now check permission status (lazy-loads expo-location)
      const status = await getLocationPermissionStatus();
      if (cancelled) return;
      setPermissionStatus(status);

      // If already granted and no cached data, fetch fresh
      if (status === 'granted' && !cached) {
        const data = await fetchPressure();
        if (!cancelled) setPressure(data);
      }

      if (!cancelled) setIsLoading(false);
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestLocationPermission();
    if (granted) {
      setPermissionStatus('granted');
      setIsLoading(true);
      const data = await fetchPressure();
      setPressure(data);
      setIsLoading(false);
    } else {
      setPermissionStatus('denied');
    }
  }, []);

  return { pressure, permissionStatus, isLoading, requestPermission };
}
