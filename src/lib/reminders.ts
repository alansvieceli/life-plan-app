import { type AppState, isRecord } from './appState';
import { parseDateKey } from './dates';
import { timeToMinutes } from './formatters';

export type ReminderSettings = { enabled: boolean; minutesBefore: number };

export const REMINDER_MINUTES_OPTIONS = [5, 10, 15, 30, 60] as const;

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  minutesBefore: 5,
};

export type Reminder = {
  id: string;
  title: string;
  body: string;
  trigger:
    | { kind: 'weekly'; weekday: number; hour: number; minute: number }
    | { kind: 'date'; date: Date };
};

const MINUTES_PER_DAY = 1440;

export function normalizeReminderSettings(raw: unknown): ReminderSettings {
  if (!isRecord(raw)) return DEFAULT_REMINDER_SETTINGS;
  const minutesBefore = REMINDER_MINUTES_OPTIONS.find(
    (option) => option === raw.minutesBefore,
  );
  return {
    enabled:
      typeof raw.enabled === 'boolean'
        ? raw.enabled
        : DEFAULT_REMINDER_SETTINGS.enabled,
    minutesBefore: minutesBefore ?? DEFAULT_REMINDER_SETTINGS.minutesBefore,
  };
}

function bodyFor(startTime: string, minutesBefore: number) {
  return `Começa em ${minutesBefore} min (${startTime})`;
}

export function buildReminders(
  state: AppState,
  settings: ReminderSettings,
  now: Date,
): Reminder[] {
  const { minutesBefore } = settings;
  const reminders: Reminder[] = [];

  for (const routine of state.routines) {
    // The lead time is at most 60 min, so crossing midnight shifts one day back.
    const fireMinutes = timeToMinutes(routine.startTime) - minutesBefore;
    const dayShift = fireMinutes < 0 ? -1 : 0;
    const minuteOfDay = (fireMinutes + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    for (const weekday of routine.weekdays) {
      reminders.push({
        id: `routine-${routine.id}-${weekday}`,
        title: routine.title,
        body: bodyFor(routine.startTime, minutesBefore),
        trigger: {
          kind: 'weekly',
          weekday: (weekday + dayShift + 7) % 7,
          hour: Math.floor(minuteOfDay / 60),
          minute: minuteOfDay % 60,
        },
      });
    }
  }

  for (const oneOff of state.oneOffs) {
    const day = parseDateKey(oneOff.date);
    const date = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      0,
      timeToMinutes(oneOff.startTime) - minutesBefore,
    );
    if (date.getTime() <= now.getTime()) continue;
    reminders.push({
      id: `oneoff-${oneOff.id}`,
      title: oneOff.title,
      body: bodyFor(oneOff.startTime, minutesBefore),
      trigger: { kind: 'date', date },
    });
  }

  return reminders;
}
