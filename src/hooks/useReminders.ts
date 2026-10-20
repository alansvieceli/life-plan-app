import { useEffect, useState } from 'react';

import { Notifications } from '../lib/notifications';
import { DEFAULT_REMINDER_SETTINGS, normalizeReminderSettings } from '../lib/reminders';
import { ensureReminderChannel } from '../lib/syncReminders';
import { useDeviceSetting } from './useDeviceSetting';

const STORAGE_KEY = '@life-plan-app/reminders/v1';

async function checkPermission(shouldRequest: boolean) {
  let { status } = await Notifications.getPermissionsAsync();
  if (status === 'undetermined' && shouldRequest) {
    // Android 13+ only shows the permission prompt once a notification channel exists.
    await ensureReminderChannel();
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  return status === 'granted';
}

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
    checkPermission(settings.enabled)
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
