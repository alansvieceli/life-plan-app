import AsyncStorage from '@react-native-async-storage/async-storage';

// `failed` tells a missing value (fine, use the default) from a read or parse error,
// so callers can avoid destructive actions based on a default that was never the user's.
export async function loadDeviceSetting<T>(
  key: string,
  normalize: (raw: unknown) => T,
): Promise<{ value: T; failed: boolean }> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return {
      value: normalize(raw === null ? undefined : JSON.parse(raw)),
      failed: false,
    };
  } catch {
    return { value: normalize(undefined), failed: true };
  }
}

export async function saveDeviceSetting<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
