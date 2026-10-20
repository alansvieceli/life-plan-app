import { useEffect, useState } from 'react';

import { DEFAULT_REMINDER_SETTINGS, normalizeReminderSettings } from '../lib/reminders';
import { checkNotificationPermission } from '../lib/syncReminders';
import { useDeviceSetting } from './useDeviceSetting';

const STORAGE_KEY = '@life-plan-app/reminders/v1';

export function useReminders() {
  const {
    value: settings,
    isLoaded,
    save,
  } = useDeviceSetting(
    STORAGE_KEY,
    DEFAULT_REMINDER_SETTINGS,
    normalizeReminderSettings,
  );
  // null until the permission has been checked.
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Asks for the permission at start and whenever the switch is turned on.
  useEffect(() => {
    if (!isLoaded) return;
    let isMounted = true;
    checkNotificationPermission(settings.enabled)
      .catch(() => false)
      .then((granted) => {
        if (isMounted) setHasPermission(granted);
      });
    return () => {
      isMounted = false;
    };
  }, [isLoaded, settings.enabled]);

  return {
    settings,
    isLoaded,
    hasPermission,
    setEnabled: (enabled: boolean) => save({ ...settings, enabled }),
    setMinutesBefore: (minutesBefore: number) => save({ ...settings, minutesBefore }),
  };
}

export type RemindersStore = ReturnType<typeof useReminders>;
