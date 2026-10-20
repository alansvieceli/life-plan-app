import type { AppState } from './appState';
import { Notifications } from './notifications';
import { buildReminders, type Reminder, type ReminderSettings } from './reminders';

const CHANNEL_ID = 'events';

export async function ensureReminderChannel() {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Eventos',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

function toRequest(reminder: Reminder) {
  const { trigger } = reminder;
  const types = Notifications.SchedulableTriggerInputTypes;
  return {
    identifier: reminder.id,
    content: { title: reminder.title, body: reminder.body },
    trigger:
      trigger.kind === 'weekly'
        ? {
            type: types.WEEKLY,
            // Expo weekdays go from 1 (Sunday) to 7; ours from 0 (Sunday) to 6.
            weekday: trigger.weekday + 1,
            hour: trigger.hour,
            minute: trigger.minute,
            channelId: CHANNEL_ID,
          }
        : { type: types.DATE, date: trigger.date, channelId: CHANNEL_ID },
  };
}

async function run(
  state: AppState,
  settings: ReminderSettings,
  hasPermission: boolean,
  now: Date,
) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.enabled || !hasPermission) return;

  await ensureReminderChannel();
  for (const reminder of buildReminders(state, settings, now)) {
    await Notifications.scheduleNotificationAsync(toRequest(reminder));
  }
}

// Syncs are chained so a slow sync can never interleave with the next one and
// leave notifications from an older state scheduled.
let queue: Promise<unknown> = Promise.resolve();

export function syncReminders(
  state: AppState,
  settings: ReminderSettings,
  hasPermission: boolean,
  now: Date = new Date(),
): Promise<void> {
  const next = queue.then(() => run(state, settings, hasPermission, now));
  queue = next.catch(() => undefined);
  return next.catch(() => undefined);
}
