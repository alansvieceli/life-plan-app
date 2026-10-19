import { type AppState, createDefaultState } from './appState';
import {
  buildReminders,
  DEFAULT_REMINDER_SETTINGS,
  normalizeReminderSettings,
} from './reminders';

const NOW = new Date(2026, 9, 6, 12, 0);
const settings = (minutesBefore = 5) => ({ enabled: true, minutesBefore });
const stateWith = (partial: Partial<AppState>): AppState => ({
  ...createDefaultState(),
  ...partial,
});
const routine = (startTime: string, weekdays: number[]) => ({
  id: 'r1',
  title: 'Academia',
  weekdays,
  startTime,
  durationMin: 60,
});
const oneOff = (date: string, startTime: string) => ({
  id: 'o1',
  title: 'Dentista',
  date,
  startTime,
  durationMin: 60,
});

describe('normalizeReminderSettings', () => {
  it('returns the defaults for missing or invalid values', () => {
    expect(normalizeReminderSettings(undefined)).toEqual(DEFAULT_REMINDER_SETTINGS);
    expect(normalizeReminderSettings('x')).toEqual(DEFAULT_REMINDER_SETTINGS);
    expect(normalizeReminderSettings({ enabled: 'yes', minutesBefore: 7 })).toEqual(
      DEFAULT_REMINDER_SETTINGS,
    );
  });

  it('keeps valid values', () => {
    expect(normalizeReminderSettings({ enabled: false, minutesBefore: 30 })).toEqual({
      enabled: false,
      minutesBefore: 30,
    });
  });

  it('defaults to enabled with 5 minutes', () => {
    expect(DEFAULT_REMINDER_SETTINGS).toEqual({ enabled: true, minutesBefore: 5 });
  });
});

describe('buildReminders for routines', () => {
  it('creates one weekly reminder per weekday', () => {
    const reminders = buildReminders(
      stateWith({ routines: [routine('08:00', [1, 3])] }),
      settings(),
      NOW,
    );
    expect(reminders.map((reminder) => reminder.trigger)).toEqual([
      { kind: 'weekly', weekday: 1, hour: 7, minute: 55 },
      { kind: 'weekly', weekday: 3, hour: 7, minute: 55 },
    ]);
    expect(reminders[0]).toMatchObject({
      id: 'routine-r1-1',
      title: 'Academia',
      body: 'Começa em 5 min (08:00)',
    });
  });

  it('shifts to the previous weekday when the reminder crosses midnight', () => {
    const reminders = buildReminders(
      stateWith({ routines: [routine('00:03', [0, 1])] }),
      settings(),
      NOW,
    );
    expect(reminders.map((reminder) => reminder.trigger)).toEqual([
      { kind: 'weekly', weekday: 6, hour: 23, minute: 58 },
      { kind: 'weekly', weekday: 0, hour: 23, minute: 58 },
    ]);
  });

  it('uses the configured lead time', () => {
    const [reminder] = buildReminders(
      stateWith({ routines: [routine('08:00', [2])] }),
      settings(60),
      NOW,
    );
    expect(reminder.trigger).toEqual({
      kind: 'weekly',
      weekday: 2,
      hour: 7,
      minute: 0,
    });
    expect(reminder.body).toBe('Começa em 60 min (08:00)');
  });

  it('shifts a midnight routine with a long lead time to the previous day', () => {
    const [reminder] = buildReminders(
      stateWith({ routines: [routine('00:00', [1])] }),
      settings(60),
      NOW,
    );
    expect(reminder.trigger).toEqual({
      kind: 'weekly',
      weekday: 0,
      hour: 23,
      minute: 0,
    });
  });
});

describe('buildReminders for one-offs', () => {
  it('creates a date reminder for a future one-off', () => {
    const [reminder] = buildReminders(
      stateWith({ oneOffs: [oneOff('2026-10-06', '15:30')] }),
      settings(),
      NOW,
    );
    expect(reminder).toMatchObject({
      id: 'oneoff-o1',
      title: 'Dentista',
      body: 'Começa em 5 min (15:30)',
    });
    expect(reminder.trigger).toEqual({
      kind: 'date',
      date: new Date(2026, 9, 6, 15, 25),
    });
  });

  it('skips a one-off whose reminder moment has passed or is now', () => {
    expect(
      buildReminders(
        stateWith({ oneOffs: [oneOff('2026-10-06', '12:03')] }),
        settings(),
        NOW,
      ),
    ).toEqual([]);
    expect(
      buildReminders(
        stateWith({ oneOffs: [oneOff('2026-10-06', '12:05')] }),
        settings(),
        NOW,
      ),
    ).toEqual([]);
    expect(
      buildReminders(
        stateWith({ oneOffs: [oneOff('2026-10-05', '20:00')] }),
        settings(),
        NOW,
      ),
    ).toEqual([]);
  });

  it('fires the day before for a one-off just after midnight', () => {
    const [reminder] = buildReminders(
      stateWith({ oneOffs: [oneOff('2026-10-07', '00:02')] }),
      settings(),
      NOW,
    );
    expect(reminder.trigger).toEqual({
      kind: 'date',
      date: new Date(2026, 9, 6, 23, 57),
    });
  });
});

describe('buildReminders overall', () => {
  it('returns an empty list when there are no events', () => {
    expect(buildReminders(createDefaultState(), settings(), NOW)).toEqual([]);
  });
});
