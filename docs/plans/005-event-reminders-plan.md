# Plan 005 - Event Reminders

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Fire a local notification `minutesBefore` minutes before every routine occurrence and one-off activity, with the lead time and an on/off switch configured in the Maintenance tab.

**Architecture:** Pure logic in `src/lib/reminders.ts` (settings, `buildReminders`), unit tested. `src/lib/notifications.ts` wraps `expo-notifications` (no-op in Expo Go); `src/lib/syncReminders.ts` cancels everything and reschedules from `buildReminders`, serialized so overlapping syncs cannot interleave. A generic `deviceSettings` storage helper and `useDeviceSetting` hook keep device settings out of `AppState` and out of the backup (reused by plan 006). `useReminders` adds the permission state; `LifePlanApp` runs the sync; `RemindersSection` is the UI.

**Tech Stack:** Expo SDK 56, React Native 0.85, TypeScript strict, Jest (`jest-expo`), Biome, Knip, `expo-notifications`, `expo-constants`.

**Spec:** `docs/specs/002-event-reminders.md`. Depends on plans 001-004. Plan 006 depends on this plan (`useDeviceSetting`).

## Global Constraints

- Android only; no backend, no authentication, no paid service; all data stays on the device.
- Only `expo-notifications` and `expo-constants` are added, via `npx expo install`; run `npx expo install --check` after.
- TypeScript strict, no `any`, no `@ts-ignore`; Biome single quotes, 2 spaces, line width 88; `npm run check` green; `src/lib/` coverage above 80%; duplication at or below 5% (`npm run dup`).
- Standards: `docs/standards/react-native-standards.md` (screens never import AsyncStorage; hooks only), `docs/standards/ui-copy-policy.md` (pt-BR sentence case).
- Settings key `@life-plan-app/reminders/v1`, stored separately from `@life-plan-app/state/v1`; not part of the backup file; `AppState` and the backup format do not change.
- `minutesBefore` is one of `5, 10, 15, 30, 60`, default 5; `enabled` defaults to `true`.
- Notification title = event title; body = `Começa em N min (HH:mm)`.
- Commits `type: message`, ending with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; the merge commit uses `chore:`.
- Work on branch `feat/event-reminders` created from `master`.

## Review Focus

- A routine starting within the lead time after midnight (`00:03`, 5 min) fires the previous day, and Sunday wraps to Saturday (Task 1 tests).
- A one-off whose reminder moment already passed, or equals now, schedules nothing, and one that starts just after midnight fires the day before (Task 1 tests).
- Editing events quickly twice in a row cannot leave a stale notification from the first sync (Task 3 test: serialized syncs).
- Disabled switch or missing permission leaves nothing scheduled (Task 3 tests).
- Corrupt or missing stored settings fall back to defaults instead of crashing (Task 1 and Task 2 tests).
- Notifications are not delayed by Android battery optimization (Task 5, manual: if they arrive minutes late, add `android.permission.SCHEDULE_EXACT_ALARM` to `app.json`).

---

### Task 1: Reminder rules (TDD)

**Files:** Create `src/lib/reminders.ts`, `src/lib/reminders.test.ts`.

**Interfaces (produces):**
- `type ReminderSettings = { enabled: boolean; minutesBefore: number }`, `REMINDER_MINUTES_OPTIONS = [5, 10, 15, 30, 60] as const`, `DEFAULT_REMINDER_SETTINGS`, `normalizeReminderSettings(raw: unknown): ReminderSettings`.
- `type Reminder = { id: string; title: string; body: string; trigger: { kind: 'weekly'; weekday: number; hour: number; minute: number } | { kind: 'date'; date: Date } }` (`weekday` uses JS numbering, 0 = Sunday).
- `buildReminders(state: AppState, settings: ReminderSettings, now: Date): Reminder[]`.

- [ ] **Step 1: Write the failing tests** in `src/lib/reminders.test.ts`:

```ts
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
    expect(reminder.trigger).toEqual({ kind: 'weekly', weekday: 2, hour: 7, minute: 0 });
    expect(reminder.body).toBe('Começa em 60 min (08:00)');
  });

  it('shifts a midnight routine with a long lead time to the previous day', () => {
    const [reminder] = buildReminders(
      stateWith({ routines: [routine('00:00', [1])] }),
      settings(60),
      NOW,
    );
    expect(reminder.trigger).toEqual({ kind: 'weekly', weekday: 0, hour: 23, minute: 0 });
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
    expect(reminder.trigger).toEqual({ kind: 'date', date: new Date(2026, 9, 6, 15, 25) });
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
    expect(reminder.trigger).toEqual({ kind: 'date', date: new Date(2026, 9, 6, 23, 57) });
  });
});

describe('buildReminders overall', () => {
  it('returns an empty list when there are no events', () => {
    expect(buildReminders(createDefaultState(), settings(), NOW)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run** `npx jest src/lib/reminders`; expect FAIL (module missing).
- [ ] **Step 3: Implement** `src/lib/reminders.ts`:

```ts
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
      typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_REMINDER_SETTINGS.enabled,
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
```

- [ ] **Step 4: Run** `npx jest src/lib/reminders`; expect PASS.
- [ ] **Step 5: Commit**

```bash
git switch -c feat/event-reminders
git add docs/specs docs/plans src/lib/reminders.ts src/lib/reminders.test.ts
git commit -m "feat: add event reminder rules"
```

(The specs 002 and 003 and plans 005 and 006 are committed here, on the feature branch, together with the first task.)

### Task 2: Device settings storage and hook (TDD for storage)

**Files:** Create `src/storage/deviceSettings.ts`, `src/storage/deviceSettings.test.ts`, `src/hooks/useDeviceSetting.ts`.

**Interfaces (produces):**
- `loadDeviceSetting<T>(key: string, normalize: (raw: unknown) => T): Promise<T>`; `saveDeviceSetting<T>(key: string, value: T): Promise<void>`.
- `type DeviceSetting<T> = { value: T; isLoaded: boolean; save: (next: T) => Promise<void> }`; `useDeviceSetting<T>(key: string, defaults: T, normalize: (raw: unknown) => T): DeviceSetting<T>`. `normalize` must be a stable (module-level) function.

- [ ] **Step 1: Write the failing test** `src/storage/deviceSettings.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadDeviceSetting, saveDeviceSetting } from './deviceSettings';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const normalize = (raw: unknown) => (typeof raw === 'number' ? raw : -1);

beforeEach(() => AsyncStorage.clear());

describe('device settings', () => {
  it('normalizes undefined when nothing is stored', async () => {
    expect(await loadDeviceSetting('k', normalize)).toBe(-1);
  });

  it('round trips a saved value', async () => {
    await saveDeviceSetting('k', 7);
    expect(await loadDeviceSetting('k', normalize)).toBe(7);
  });

  it('falls back to the normalized default on corrupt JSON', async () => {
    await AsyncStorage.setItem('k', '{broken');
    expect(await loadDeviceSetting('k', normalize)).toBe(-1);
  });
});
```

- [ ] **Step 2: Run** `npx jest src/storage`; expect FAIL.
- [ ] **Step 3: Implement** `src/storage/deviceSettings.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadDeviceSetting<T>(
  key: string,
  normalize: (raw: unknown) => T,
): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return normalize(raw === null ? undefined : JSON.parse(raw));
  } catch {
    return normalize(undefined);
  }
}

export async function saveDeviceSetting<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
```

- [ ] **Step 4: Implement** `src/hooks/useDeviceSetting.ts`:

```ts
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
```

- [ ] **Step 5:** `npm run fix && npx jest src/storage && npx tsc --noEmit`; expect green. (Knip will flag the hook as unused until Task 4; run `npm run check` in Task 4.) Commit `feat: add device settings storage`.

### Task 3: Notification wrapper and sync (TDD for sync)

**Files:** Create `src/lib/notifications.ts`, `src/lib/syncReminders.ts`, `src/lib/syncReminders.test.ts`; modify `app.json`, `package.json`, `package-lock.json`.

**Interfaces (consumes):** `buildReminders`, `ReminderSettings`, `AppState`.
**Interfaces (produces):** `Notifications` (the `expo-notifications` module or a no-op stub); `syncReminders(state: AppState, settings: ReminderSettings, hasPermission: boolean, now?: Date): Promise<void>`.

- [ ] **Step 1: Install dependencies**

```bash
npx expo install expo-notifications expo-constants
npx expo install --check
```

Expect both added to `package.json`, check clean.

- [ ] **Step 2: Add the config plugin** to `app.json` `plugins` (after `"expo-font"`):

```json
[
  "expo-notifications",
  {
    "color": "#7C9A7E"
  }
]
```

- [ ] **Step 3: Implement the wrapper** `src/lib/notifications.ts`:

```ts
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
```

If Biome flags `require` (`noCommonJs`), add a `// biome-ignore lint/...: conditional load to avoid the Expo Go crash` comment with the exact rule name Biome prints.

- [ ] **Step 4: Write the failing test** `src/lib/syncReminders.test.ts`:

```ts
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
  routines: [
    { id: 'r1', title, weekdays: [0], startTime: '08:00', durationMin: 60 },
  ],
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
        { id: 'o1', title: 'B', date: '2026-10-06', startTime: '15:30', durationMin: 60 },
      ],
    };
    await syncReminders(state, enabled, true, NOW);
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'oneoff-o1',
      content: { title: 'B', body: 'Começa em 5 min (15:30)' },
      trigger: { type: 'date', date: new Date(2026, 9, 6, 15, 25), channelId: 'events' },
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
```

- [ ] **Step 5: Run** `npx jest src/lib/syncReminders`; expect FAIL (module missing).
- [ ] **Step 6: Implement** `src/lib/syncReminders.ts`:

```ts
import type { AppState } from './appState';
import { Notifications } from './notifications';
import { buildReminders, type Reminder, type ReminderSettings } from './reminders';

const CHANNEL_ID = 'events';

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

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Eventos',
    importance: Notifications.AndroidImportance.HIGH,
  });
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
```

- [ ] **Step 7: Run** `npx jest src/lib/syncReminders && npx tsc --noEmit`; expect PASS. If the typed `scheduleNotificationAsync` request rejects the trigger shape, fix the shape to match the installed `expo-notifications` types rather than casting.
- [ ] **Step 8:** `npm run fix`; commit `feat: schedule event reminders`.

### Task 4: Reminder hook, section UI and wiring

**Files:** Create `src/hooks/useReminders.ts`, `src/components/maintenance/RemindersSection.tsx`; modify `src/components/common/ChipRow.tsx`, `src/components/maintenance/MaintenanceScreen.tsx`, `src/LifePlanApp.tsx`.

**Interfaces (consumes):** `useDeviceSetting`, `ReminderSettings` helpers, `Notifications`, `syncReminders`.
**Interfaces (produces):** `useReminders(): RemindersStore` with `{ settings: ReminderSettings; isLoaded: boolean; hasPermission: boolean | null; setEnabled(enabled: boolean): void; setMinutesBefore(minutes: number): void }`; `type RemindersStore = ReturnType<typeof useReminders>`.

- [ ] **Step 1: Add a `disabled` prop to `ChipRow`** (`src/components/common/ChipRow.tsx`): add `disabled?: boolean` to `ChipRowProps`, destructure it, and on each `Pressable` set `disabled={disabled}`, `accessibilityState={{ selected: isSelected, disabled }}` and add `disabled ? styles.chipDisabled : null` to the style array. Add to `styles`:

```ts
  chipDisabled: {
    opacity: 0.5,
  },
```

- [ ] **Step 2: Implement** `src/hooks/useReminders.ts`:

```ts
import { useEffect, useState } from 'react';

import { Notifications } from '../lib/notifications';
import {
  DEFAULT_REMINDER_SETTINGS,
  normalizeReminderSettings,
} from '../lib/reminders';
import { useDeviceSetting } from './useDeviceSetting';

const STORAGE_KEY = '@life-plan-app/reminders/v1';

async function checkPermission(shouldRequest: boolean) {
  let { status } = await Notifications.getPermissionsAsync();
  if (status === 'undetermined' && shouldRequest) {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  return status === 'granted';
}

export function useReminders() {
  const { value: settings, isLoaded, save } = useDeviceSetting(
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
```

- [ ] **Step 3: Implement** `src/components/maintenance/RemindersSection.tsx`:

```tsx
import { StyleSheet, Switch, Text, View } from 'react-native';

import { REMINDER_MINUTES_OPTIONS, type ReminderSettings } from '../../lib/reminders';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ChipRow } from '../common/ChipRow';
import { SectionCard } from '../common/SectionCard';

type RemindersSectionProps = {
  settings: ReminderSettings;
  hasPermission: boolean | null;
  onToggle: (enabled: boolean) => void;
  onSelectMinutes: (minutes: number) => void;
};

const options = REMINDER_MINUTES_OPTIONS.map((minutes) => ({
  id: String(minutes),
  label: minutes === 60 ? '1 h' : `${minutes} min`,
}));

export function RemindersSection({
  settings,
  hasPermission,
  onToggle,
  onSelectMinutes,
}: RemindersSectionProps) {
  return (
    <SectionCard title="Lembretes">
      <View style={styles.row}>
        <Text style={styles.label}>Avisar antes dos eventos</Text>
        <Switch
          accessibilityLabel="Avisar antes dos eventos"
          onValueChange={onToggle}
          thumbColor={colors.surface}
          trackColor={{ false: colors.border, true: colors.accent }}
          value={settings.enabled}
        />
      </View>
      <Text style={styles.note}>Antecedência</Text>
      <ChipRow
        disabled={!settings.enabled}
        onSelect={(id) => onSelectMinutes(Number(id))}
        options={options}
        selectedId={String(settings.minutesBefore)}
      />
      {settings.enabled && hasPermission === false ? (
        <Text style={styles.warning}>
          Permita as notificações nas configurações do Android para receber os avisos.
        </Text>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textPrimary,
    flex: 1,
    ...typography.body,
  },
  note: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
  warning: {
    color: colors.negative,
    ...typography.bodySmall,
  },
});
```

- [ ] **Step 4: Wire `MaintenanceScreen`** (`src/components/maintenance/MaintenanceScreen.tsx`): add the prop and render the section first.

```tsx
import type { RemindersStore } from '../../hooks/useReminders';
import { RemindersSection } from './RemindersSection';

export function MaintenanceScreen({
  store,
  reminders,
}: {
  store: AppStore;
  reminders: RemindersStore;
}) {
```

and inside the `ScrollView`, between `HousesSection` and `DataSection`:

```tsx
      <RemindersSection
        hasPermission={reminders.hasPermission}
        onSelectMinutes={reminders.setMinutesBefore}
        onToggle={reminders.setEnabled}
        settings={reminders.settings}
      />
```

- [ ] **Step 5: Wire `LifePlanApp`** (`src/LifePlanApp.tsx`): import `useReminders` and `syncReminders`, create the store next to `useAppState`, add the sync effect before the `if (!isReady) return null;` line, and pass the prop.

```tsx
import { useReminders } from './hooks/useReminders';
import { syncReminders } from './lib/syncReminders';

  const reminders = useReminders();
```

```tsx
  useEffect(() => {
    if (!store.isLoaded || !reminders.isLoaded || reminders.hasPermission === null) {
      return;
    }
    syncReminders(store.state, reminders.settings, reminders.hasPermission);
  }, [
    store.isLoaded,
    store.state,
    reminders.isLoaded,
    reminders.settings,
    reminders.hasPermission,
  ]);
```

```tsx
        {activeTab === 'maintenance' ? (
          <MaintenanceScreen reminders={reminders} store={store} />
        ) : null}
```

- [ ] **Step 6:** `npm run fix && npm run check && npm run dup`; expect green, 0 new clones. `npx expo export --platform android`; expect bundle OK.
- [ ] **Step 7:** Commit `feat: add reminders section to maintenance`.

### Task 5: Manual check, documentation and merge

- [ ] **Manual check** (left to the user when no device is available): build with `npm run android` (needs a native build, not Expo Go). Confirm the permission prompt appears on first start; create a one-off a few minutes ahead and a routine on today's weekday, and confirm the notifications arrive at the right time with title and `Começa em 5 min (HH:mm)`; change the lead time and confirm it reschedules; switch off and confirm nothing arrives; deny the permission and confirm the hint shows. If notifications arrive minutes late, add `"permissions": ["android.permission.SCHEDULE_EXACT_ALARM"]` under `android` in `app.json` and rebuild.
- [ ] Update `README.md` (reminders implemented, how to run a native build), `docs/app-context.md` (Status, reminders concept, settings key and that device settings are outside the backup), `docs/standards/react-native-standards.md` (the storage rule: `useAppState` and `useDeviceSetting` are the only code that reads or writes AsyncStorage) and the coverage and duplication baselines wherever `docs/quality/` records them.
- [ ] Run `npm run check` and `npm run dup`; expect green. Per `docs/standards/spec-completion-policy.md`, the spec is not complete until `npm run check` passes.
- [ ] Commit `docs: document event reminders`, then merge into `master` with a `chore: merge event reminders` commit.
