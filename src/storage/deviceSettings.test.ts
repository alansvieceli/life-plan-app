import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadDeviceSetting, saveDeviceSetting } from './deviceSettings';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const normalize = (raw: unknown) => (typeof raw === 'number' ? raw : -1);

beforeEach(() => AsyncStorage.clear());

describe('device settings', () => {
  it('normalizes undefined when nothing is stored', async () => {
    expect(await loadDeviceSetting('k', normalize)).toBe(-1);
  });

  it('round trips a saved value', async () => {
    await saveDeviceSetting('k', 7);
    expect(await loadDeviceSetting('k', normalize)).toBe(7);
  });

  it('falls back to the normalized default on corrupt JSON', async () => {
    await AsyncStorage.setItem('k', '{broken');
    expect(await loadDeviceSetting('k', normalize)).toBe(-1);
  });
});
