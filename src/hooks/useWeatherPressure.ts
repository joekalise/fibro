import { useState, useEffect, useCallback } from 'react';
import { getCachedPressure, fetchPressure, PressureData } from '@/services/weather';

export function useWeatherPressure() {
  const [pressure, setPressure] = useState<PressureData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    getCachedPressure()
      .then((cached) => setPressure(cached))
      .catch(() => setPressure(null))
      .finally(() => setIsLoading(false));
  }, []);

  const refresh = useCallback(async () => {
    if (isFetching) return;
    setIsFetching(true);
    try {
      const data = await fetchPressure();
      setPressure(data);
    } catch {
      // non-fatal
    } finally {
      setIsFetching(false);
    }
  }, [isFetching]);

  return { pressure, isLoading, isFetching, refresh };
}
