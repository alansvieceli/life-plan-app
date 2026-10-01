# Life Plan

Personal Android app (React Native, Expo, TypeScript) to organize the week and keep a shopping list split across houses. Single user, offline-first: all data stays on the device.

## Current status

Implemented:

- Themed app shell (paper tones, sage green, serif titles) with header, time-based greeting and three tabs: `Semana`, `Compras`, `Manutenção`.
- App icon and native splash screen (kept until saved data is loaded).
- `Manutenção`: manage houses (free list, at least one), back up, restore and reset local data.

Planned (see `docs/specs/001-life-plan-app.md`): weekly planner with recurring and one-off activities and the shopping list by house. `Semana` and `Compras` are placeholders until those plans are executed.

## Requirements

- Node.js 24 and npm
- Android Studio with an emulator (Android only)

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
