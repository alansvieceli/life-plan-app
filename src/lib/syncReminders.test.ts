import { createDefaultState } from './appState';
import { Notifications } from './notifications';
import { syncReminders } from './syncReminders';

const events: string[] = [];

jest.mock('./notifications', () => ({
  Notifications: {
    cancelAllScheduledNotificationsAsync: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    setNotificationChannelAsync: jest.fn(),
    AndroidImportance: { HIGH: 4 },
    SchedulableTriggerInputTypes: { DATE: 'date', WEEKLY: 'weekly' },
  },
}));

const mocked = jest.mocked(Notifications);
const NOW = new Date(2026, 9, 6, 12, 0);
const enabled = { enabled: true, minutesBefore: 5 };
const routineState = (title: string) => ({
  ...createDefaultState(),
  routines: [{ id: 'r1', title, weekdays: [0], startTime: '08:00', durationMin: 60 }],
});

beforeEach(() => {
  events.length = 0;
  jest.clearAllMocks();
  mocked.cancelAllScheduledNotificationsAsync.mockImplementation(async () => {
    events.push('cancel');
  });
  mocked.scheduleNotificationAsync.mockImplementation(async (request) => {
    events.push(`schedule:${request.content.title}`);
    return 'id';
  });
});

describe('syncReminders', () => {
  it('only cancels when reminders are disabled', async () => {
    await syncReminders(
      routineState('A'),
      { enabled: false, minutesBefore: 5 },
      true,
      NOW,
    );
    expect(events).toEqual(['cancel']);
  });

  it('only cancels when the permission is not granted', async () => {
    await syncReminders(routineState('A'), enabled, false, NOW);
    expect(events).toEqual(['cancel']);
  });

  it('schedules a weekly trigger with the 1-7 weekday expected by Expo', async () => {
    await syncReminders(routineState('A'), enabled, true, NOW);
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'routine-r1-0',
      content: { title: 'A', body: 'Começa em 5 min (08:00)' },
      trigger: {
        type: 'weekly',
        weekday: 1,
        hour: 7,
        minute: 55,
        channelId: 'events',
      },
    });
  });

  it('schedules a date trigger for a one-off', async () => {
    const state = {
      ...createDefaultState(),
      oneOffs: [
        {
          id: 'o1',
          title: 'B',
          date: '2026-10-06',
          startTime: '15:30',
          durationMin: 60,
        },
      ],
    };
    await syncReminders(state, enabled, true, NOW);
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'oneoff-o1',
      content: { title: 'B', body: 'Começa em 5 min (15:30)' },
      trigger: {
        type: 'date',
        date: new Date(2026, 9, 6, 15, 25),
        channelId: 'events',
      },
    });
  });

  it('runs overlapping syncs one after the other', async () => {
    const first = syncReminders(routineState('A'), enabled, true, NOW);
    const second = syncReminders(routineState('B'), enabled, true, NOW);
    await Promise.all([first, second]);
    expect(events).toEqual(['cancel', 'schedule:A', 'cancel', 'schedule:B']);
  });

  it('keeps working after a failed sync', async () => {
    mocked.scheduleNotificationAsync.mockRejectedValueOnce(new Error('boom'));
    await syncReminders(routineState('A'), enabled, true, NOW);
    await syncReminders(routineState('B'), enabled, true, NOW);
    expect(events).toEqual(['cancel', 'cancel', 'schedule:B']);
  });
});
