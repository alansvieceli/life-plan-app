# App Context

## Purpose

Life Plan is a personal Android app (React Native, Expo, TypeScript) for one user. It helps organize the week and keep a shopping list split across houses.

## Status

Implemented: themed app shell with header (app icon, time-based greeting), three tabs, app icon, native splash held until saved data loads, the `Semana` tab (week navigation, day strip, routines and one-off activities with start time and duration, overlap marker, add/edit/delete), the `Compras` tab (items per house, filter, bought toggle, clear bought) and the `Manutenção` tab (event reminders, houses, backup, restore, reset).

## Data

One JSON state document in AsyncStorage (`houses`, `routines`, `oneOffs`, `shoppingItems`). Houses are a free list with at least one (default `Casa 1` and `Casa 2`); a house with shopping items cannot be deleted. Backups are `.lpb` JSON files with a SHA-256 integrity hash; restore validates everything first and is atomic. Activities: a routine repeats on chosen weekdays every week; a one-off belongs to one date. Times are 24-hour `HH:mm`, duration is in minutes (1 to 1440), weeks start on Sunday, and activities that cross midnight belong to their start day. Overlaps are flagged, never blocked. Reset returns to the default state. Bought shopping items stay in the list until cleared.

## Reminders

The app schedules local notifications (no backend) `minutesBefore` minutes before each event: routines repeat weekly on their weekdays, one-offs fire once. The lead time (5, 10, 15, 30 or 60 min; default 5) and an on/off switch (default on) live in `Manutenção` > `Lembretes`. The settings are device settings in AsyncStorage (`@life-plan-app/reminders/v1`), kept outside the state document and outside the backup. Every state or settings change cancels and reschedules all reminders. Reminders need a native Android build (`npm run android`); in Expo Go they are a no-op. The Android notification permission is requested at start and when the switch is turned on; without it nothing is scheduled and a hint is shown.

## Planned Features

- Weekly planner: activities (for example work, reading, video games) with a start time and a duration.
- Shopping list: items to buy, each assigned to one of the two houses.
- Maintenance section: backup and restore of all local data.

## Constraints

- Android only.
- All data is stored locally on the device. No backend, hosting, or authentication.
- Single user.
- Visual identity: calm and cozy (paper tones, sage green, serif titles).
- UI copy in Brazilian Portuguese, following `docs/standards/ui-copy-policy.md`.
- Tooling: TypeScript strict, Biome, Knip.
