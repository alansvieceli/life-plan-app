import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadDeviceSetting, saveDeviceSetting } from './deviceSettings';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const normalize = (raw: unknown) => (typeof raw === 'number' ? raw : -1);

beforeEach(() => AsyncStorage.clear());

describe('device settings', () => {
  it('normalizes undefined when nothing is stored, without flagging a failure', async () => {
    expect(await loadDeviceSetting('k', normalize)).toEqual({
      value: -1,
      failed: false,
    });
  });

  it('round trips a saved value', async () => {
    await saveDeviceSetting('k', 7);
    expect(await loadDeviceSetting('k', normalize)).toEqual({
      value: 7,
      failed: false,
    });
  });

  it('falls back to the default and flags a failure on corrupt JSON', async () => {
    await AsyncStorage.setItem('k', '{broken');
    expect(await loadDeviceSetting('k', normalize)).toEqual({
      value: -1,
      failed: true,
    });
  });

  it('falls back to the default and flags a failure when the read throws', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('boom'));
    expect(await loadDeviceSetting('k', normalize)).toEqual({
      value: -1,
      failed: true,
    });
  });
});
