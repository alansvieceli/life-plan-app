import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadDeviceSetting<T>(
  key: string,
  normalize: (raw: unknown) => T,
): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return normalize(raw === null ? undefined : JSON.parse(raw));
  } catch {
    return normalize(undefined);
  }
}

export async function saveDeviceSetting<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
