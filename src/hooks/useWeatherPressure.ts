import { useState, useEffect, useCallback } from 'react';
import { getCachedPressure, fetchPressure, PressureData } from '@/services/weather';

export function useWeatherPressure() {
  const [pressure, setPressure] = useState<PressureData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    getCachedPressure()
      .then((cached) => {
        if (cached) {
          setPressure(cached);
          setIsLoading(false);
        } else {
          // No cache — fetch immediately, no tap required
          setIsLoading(false);
          setIsFetching(true);
          fetchPressure()
            .then((data) => setPressure(data))
            .catch(() => setFetchError(true))
            .finally(() => setIsFetching(false));
        }
      })
      .catch(() => {
        setPressure(null);
        setIsLoading(false);
      });
  }, []);

  const refresh = useCallback(async () => {
    if (isFetching) return;
    setIsFetching(true);
    setFetchError(false);
    try {
      const data = await fetchPressure();
      setPressure(data);
    } catch {
      setFetchError(true);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching]);

  return { pressure, isLoading, isFetching, fetchError, refresh };
}
