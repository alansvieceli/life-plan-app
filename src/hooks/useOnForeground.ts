import { useEffect, useRef } from 'react';
import { AppState as NativeAppState } from 'react-native';

export function useOnForeground(callback: () => void) {
  // The listener is registered once; the ref keeps it calling the latest callback.
  const latest = useRef(callback);
  latest.current = callback;

  useEffect(() => {
    const subscription = NativeAppState.addEventListener('change', (status) => {
      if (status === 'active') latest.current();
    });
    return () => subscription.remove();
  }, []);
}
