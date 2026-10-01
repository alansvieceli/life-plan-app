import { useCallback, useEffect, useState } from 'react';

import { loadDeviceSetting, saveDeviceSetting } from '../storage/deviceSettings';

export type DeviceSetting<T> = {
  value: T;
  isLoaded: boolean;
  save: (next: T) => Promise<void>;
};

export function useDeviceSetting<T>(
  key: string,
  defaults: T,
  normalize: (raw: unknown) => T,
): DeviceSetting<T> {
  const [value, setValue] = useState<T>(defaults);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadDeviceSetting(key, normalize).then((loaded) => {
      if (!isMounted) return;
      setValue(loaded);
      setIsLoaded(true);
    });
    return () => {
      isMounted = false;
    };
  }, [key, normalize]);

  const save = useCallback(
    async (next: T) => {
      setValue(next);
      // A failed write keeps the value for this session; it is re-read on next start.
      await saveDeviceSetting(key, next).catch(() => undefined);
    },
    [key],
  );

  return { value, isLoaded, save };
}
