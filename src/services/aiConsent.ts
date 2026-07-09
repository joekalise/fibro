import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@fibro_ai_consent';

export async function getAiConsent(): Promise<boolean | null> {
  try {
    const val = await AsyncStorage.getItem(KEY);
    if (val === null) return null;
    return val === 'true';
  } catch {
    return null;
  }
}

export async function setAiConsent(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, value ? 'true' : 'false');
  } catch {
    // non-fatal
  }
}
