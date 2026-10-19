# Spec 002 - Event Reminders

## Objective

Notify the user shortly before every event of the weekly planner (routines and one-off activities) with a local notification, and let the user configure the lead time and turn the feature on or off in the Maintenance tab.

## Context

- Single user, Android only, offline-first. No backend (see `AGENTS.md`), so "push" means a **local notification scheduled on the device** with `expo-notifications`. It works offline and looks like any push.
- Reuses the pattern of `C:\projetos\app\cycle12-finance-app` (spec 034): a `notifications` wrapper that loads `expo-notifications` only outside Expo Go, a `syncReminders` routine that cancels and reschedules everything, a `useReminders` hook and a storage module separated from the main data.
- Spec 001 listed "No notifications or alarms" as a non-goal. This spec replaces that non-goal for event reminders only.
- UI copy is Brazilian Portuguese, sentence case, per `docs/standards/ui-copy-policy.md`.

## Goals

- One notification per event occurrence, fired `minutesBefore` minutes before its start time.
- Routines notify every week on each of their weekdays, even if the app is not opened for weeks.
- One-off activities notify once, on their date.
- A `Lembretes` section in the Maintenance tab with an on/off switch and the lead time.

## Non-goals

- No remote push, backend, account or paid service.
- No notification history, snooze action, per-event lead time or per-event sound.
- No reminders for shopping items.
- Reminder settings are not part of the backup file (they are device settings, like in cycle12).
- No change to `AppState` or to the backup format.
- No Expo Go support: the feature needs a native build (`expo run:android`). In Expo Go it becomes a no-op.

## Dependency

Add `expo-notifications` (and its config plugin in `app.json`, with the theme accent color). It is the only way to schedule on-device notifications in Expo. `expo-constants` (already installed as an Expo peer) is declared explicitly to detect Expo Go. No other dependency is added. A dedicated monochrome notification icon (cycle12 spec 037) is out of scope; Android falls back to the launcher icon.

## Settings

Stored in AsyncStorage under `@life-plan-app/reminders/v1`, separately from `@life-plan-app/state/v1`:

```ts
type ReminderSettings = {
  enabled: boolean;      // default true
  minutesBefore: number; // one of 5, 10, 15, 30, 60; default 5
};
```

Invalid or missing stored values fall back to the defaults (`normalizeReminderSettings`).

The OS permission is requested on app start when `enabled` is true and the permission is still undetermined (so the feature works out of the box), and whenever the user turns the switch on. While the permission is not granted, nothing is scheduled.

## UX Behavior

### Maintenance tab: `Lembretes` section

A new section, shown above the data section, with:

- a switch `Avisar antes dos eventos`;
- a chip row `Antecedência` with `5 min`, `10 min`, `15 min`, `30 min`, `1 h`, disabled while the switch is off.

Turning the switch on requests the Android notification permission. While `enabled` is true and the permission is not granted (denied, or revoked in the system settings), nothing is scheduled and the section shows a hint saying the permission must be granted in the system settings. The permission is re-checked when the app starts.

### Notification content

- Title: the event title.
- Body: `Começa em N min (HH:mm)`, where N is `minutesBefore` and `HH:mm` is the event start time.

## Scheduling Logic

Reminders are computed from `AppState` and `ReminderSettings`:

1. A routine produces one **weekly** reminder per weekday in `weekdays`. The trigger moment is `startTime - minutesBefore`. If this moment falls on the previous day (e.g. a routine at `00:03` with 5 minutes before fires at `23:58` the day before), the weekday shifts back by one (Sunday wraps to Saturday).
2. A one-off produces one **date** reminder at `date + startTime - minutesBefore`, only if that moment is still in the future.
3. Reminder ids are deterministic (`routine-<id>-<weekday>`, `oneoff-<id>`).

`syncReminders` cancels every scheduled notification and then schedules the list above. If reminders are disabled or the permission is not granted, it only cancels.

`syncReminders` runs:

- on app start, after the stored data finishes loading;
- when reminder settings change;
- when routines or one-offs change (add, edit, delete);
- after a backup restore or a reset (they replace the state).

## Implementation Notes

- `src/lib/reminders.ts` (pure): `ReminderSettings`, `DEFAULT_REMINDER_SETTINGS`, `REMINDER_MINUTES_OPTIONS`, `normalizeReminderSettings`, `buildReminders(state, settings, now)`. No React, no Expo imports, fully unit tested.
- `src/lib/notifications.ts`: wrapper that loads `expo-notifications` only outside Expo Go and falls back to a no-op stub (same approach as cycle12).
- `src/lib/syncReminders.ts`: cancels and reschedules using `buildReminders` and the wrapper.
- `src/storage/deviceSettings.ts`: generic `loadDeviceSetting(key, normalize)` and `saveDeviceSetting(key, value)` over AsyncStorage, shared with spec 003 (no per-feature storage module).
- `src/hooks/useDeviceSetting.ts`: generic hook that loads a device setting, exposes `value`, `isLoaded` and `save`.
- `src/hooks/useReminders.ts`: built on `useDeviceSetting`; adds the permission state, `setEnabled` (requests permission) and `setMinutesBefore`.
- `src/components/maintenance/RemindersSection.tsx`: the UI, using existing `SectionCard` and `ChipRow`.
- The notification handler is configured once at app startup.
- The sync is triggered from `LifePlanApp.tsx`, in an effect that depends on `store.state`, the reminder settings and `store.isLoaded`.

## Tests

Unit tests for `reminders.ts`:

- `normalizeReminderSettings` returns defaults for missing, invalid or out-of-list values.
- A routine with 3 weekdays produces 3 weekly reminders with the right weekday, hour and minute.
- A routine whose reminder crosses midnight shifts the weekday back, including Sunday to Saturday.
- A future one-off produces one date reminder at the right moment; a one-off whose reminder moment has passed produces none.
- Changing `minutesBefore` changes the trigger time.
- Title and body follow the content format.

## Acceptance Criteria

- The Maintenance tab has a `Lembretes` section with a switch and lead-time chips.
- Turning the switch on asks for the Android permission; denial schedules nothing and shows a hint.
- With reminders on and permission granted, each routine occurrence and each future one-off fires a notification `minutesBefore` minutes before its start, with the content above.
- Routine reminders keep firing without opening the app.
- Changing events, settings, restoring a backup or resetting data reschedules correctly; turning the switch off cancels all.
- Reminder settings persist locally and are not part of the backup file.
- The app does not crash in Expo Go (the feature is a no-op there).
- `npm run check` passes and `src/lib/` coverage stays above 80%.

## Validation

```bash
npm run check
```

Manual check on an Android build (`npm run android`): create a one-off a few minutes ahead and confirm the notification arrives.
