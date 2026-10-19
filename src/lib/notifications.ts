import Constants, { ExecutionEnvironment } from 'expo-constants';

// expo-notifications throws at import time inside Expo Go (SDK 53+ removed push
// support there), so the real module is only loaded in dev and standalone builds.
// In Expo Go every call is a no-op and reminders simply never fire.
const isNotificationsAvailable =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

type NotificationsModule = typeof import('expo-notifications');

const noopAsync = async () => undefined as never;

const stub = {
  setNotificationHandler: () => undefined,
  getPermissionsAsync: async () => ({ status: 'undetermined' }) as never,
  requestPermissionsAsync: async () => ({ status: 'denied' }) as never,
  setNotificationChannelAsync: noopAsync,
  cancelAllScheduledNotificationsAsync: noopAsync,
  scheduleNotificationAsync: noopAsync,
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date', WEEKLY: 'weekly' },
} as unknown as NotificationsModule;

export const Notifications: NotificationsModule = isNotificationsAvailable
  ? (require('expo-notifications') as NotificationsModule)
  : stub;

// Show reminders even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
