import AsyncStorage from '@react-native-async-storage/async-storage';

export type PressureTrend = 'rising' | 'falling' | 'stable';

export interface PressureData {
  pressure: number; // hPa
  trend: PressureTrend;
  fetchedAt: string; // YYYY-MM-DD
}

const CACHE_KEY = '@fibro_pressure_cache';

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

// Resolve approximate coordinates via IP geolocation — no native modules,
// no permission prompt, city-level accuracy which is sufficient for pressure.
async function getCoordinates(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const json = await res.json();
    if (typeof json.latitude === 'number' && typeof json.longitude === 'number') {
      return { latitude: json.latitude, longitude: json.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchPressure(): Promise<PressureData | null> {
  try {
    const cached = await getCachedPressure();
    if (cached) return cached;

    const coords = await getCoordinates();
    if (!coords) return null;

    const { latitude, longitude } = coords;
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}` +
      `&current=surface_pressure&hourly=surface_pressure&forecast_days=1&timezone=auto`;

    const res = await fetch(url);
    const json = await res.json();

    const currentPressure: number = json.current?.surface_pressure;
    if (!currentPressure) return null;

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
