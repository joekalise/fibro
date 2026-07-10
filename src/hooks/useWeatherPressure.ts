import { useState, useEffect, useCallback } from 'react';
import {
  getLocationPermissionStatus,
  requestLocationPermission,
  fetchPressure,
  PressureData,
} from '@/services/weather';

export function useWeatherPressure() {
  const [pressure, setPressure] = useState<PressureData | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const status = await getLocationPermissionStatus();
    setPermissionStatus(status);
    if (status === 'granted') {
      const data = await fetchPressure();
      setPressure(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
