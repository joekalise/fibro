import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export type PressureTrend = 'rising' | 'falling' | 'stable';

export interface PressureData {
  pressure: number; // hPa
  trend: PressureTrend;
  fetchedAt: string; // YYYY-MM-DD
}

const CACHE_KEY = '@fibro_pressure_cache';

export async function getLocationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status as 'granted' | 'denied' | 'undetermined';
  } catch {
    return 'denied';
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function getCachedPressure(): Promise<PressureData | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed: PressureData = JSON.parse(cached);
    const today = new Date().toISOString().split('T')[0];
    return parsed.fetchedAt === today ? parsed : null;
  } catch {
    return null;
  }
}

export async function fetchPressure(): Promise<PressureData | null> {
  try {
    const cached = await getCachedPressure();
    if (cached) return cached;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    });
    const { latitude, longitude } = location.coords;

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}` +
      `&current=surface_pressure&hourly=surface_pressure&forecast_days=1&timezone=auto`;

    const res = await fetch(url);
    const json = await res.json();

    const currentPressure: number = json.current?.surface_pressure;
    if (!currentPressure) return null;

    // Trend: find current hour in hourly array, compare to +6h
    const times: string[] = json.hourly?.time ?? [];
    const pressures: number[] = json.hourly?.surface_pressure ?? [];
    const now = new Date();
    const todayPrefix = now.toISOString().split('T')[0];
    const hourStr = String(now.getHours()).padStart(2, '0');
    const currentIdx = times.findIndex((t) => t === `${todayPrefix}T${hourStr}:00`);

    let trend: PressureTrend = 'stable';
    const futureIdx = currentIdx + 6;
    if (currentIdx >= 0 && futureIdx < pressures.length) {
      const diff = pressures[futureIdx] - currentPressure;
      if (diff > 2) trend = 'rising';
      else if (diff < -2) trend = 'falling';
    }

    const data: PressureData = {
      pressure: Math.round(currentPressure),
      trend,
      fetchedAt: todayPrefix,
    };

    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return data;
  } catch {
    return null;
  }
}
