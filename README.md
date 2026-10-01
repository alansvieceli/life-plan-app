# Life Plan

Personal Android app (React Native, Expo, TypeScript) to organize the week and keep a shopping list split across houses. Single user, offline-first: all data stays on the device.

## Current status

All planned features from `docs/specs/001-life-plan-app.md` are implemented:

- Themed app shell (paper tones, sage green, Fraunces serif titles, cabin icon) with header, time-based greeting and three tabs: `Semana`, `Compras`, `Manutenção`.
- App icon and native splash screen (kept until saved data is loaded).
- `Semana`: browse weeks, see each day's activities (weekly routines and one-off activities sorted by start time, overlaps flagged), add, edit and delete activities.
- `Compras`: shopping items per house, filter by house, mark as bought, delete and clear bought items.
- `Manutenção`: reminders (a local notification before each event, with the lead time configurable), past events retention (one-off activities older than 7 to 60 days, default 10, are deleted automatically), manage houses (free list, at least one), back up, restore and reset local data.

## Requirements

- Node.js 24 and npm
- Android Studio with an emulator (Android only)

## Reminders

Event reminders use local notifications, so they need a native build (`npm run android`); in Expo Go they do nothing. Reminder settings are stored on the device and are not part of the backup file.

## Install and run

```bash
npm install
npm run android
```

`npm start` starts the Expo dev server only.

## Validation

```bash
npm run check
```

Runs Biome, TypeScript, Jest with coverage, and Knip. Related commands: `npm run lint`, `npm run format`, `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run dup`.

## Local data

All data lives on the device in one JSON document (AsyncStorage key `@life-plan-app/state/v1`). `Manutenção` > `Dados` exports a `life-plan-backup-AAAA-MM-DD.lpb` file (JSON with a SHA-256 integrity hash), restores one after validating it (altered or malformed files are rejected and current data is kept), and resets to two empty houses. The hash detects accidental or casual edits only; it is not tamper-proof. If saved data cannot be read, the app keeps it untouched and does not overwrite it.

## Commits

Husky is enabled by `npm install`. Commit messages must follow `type: message` (feat, fix, docs, test, build, perf, style, refactor, chore, ci, raw, cleanup, remove). Staged files are checked with Biome through lint-staged.

## Project structure

- `src/lib/` pure, tested logic
- `src/components/` UI components
- `src/theme/` colors and typography
- `assets/` app icon, adaptive icon and splash images
- `docs/` standards, specs, plans and app context

## Workflow

Spec first, plan second, tasks third. See `AGENTS.md` and `docs/standards/`.
