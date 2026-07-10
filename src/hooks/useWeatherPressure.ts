import { useState, useEffect, useCallback } from 'react';
import {
  requestLocationPermission,
  fetchPressure,
  getCachedPressure,
  PressureData,
} from '@/services/weather';

export function useWeatherPressure() {
  const [pressure, setPressure] = useState<PressureData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only read AsyncStorage on mount — never call expo-location here.
    // expo-location is only invoked when the user explicitly taps Enable.
    getCachedPressure()
      .then((cached) => setPressure(cached))
      .catch(() => setPressure(null))
      .finally(() => setIsLoading(false));
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const granted = await requestLocationPermission();
      if (!granted) return;
      setIsLoading(true);
      const data = await fetchPressure();
      setPressure(data);
    } catch {
      // non-fatal — user just won't see pressure data
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { pressure, isLoading, requestPermission };
}
