# Life Plan

Personal Android app (React Native, Expo, TypeScript) to organize the week and keep a shopping list split across houses. Single user, offline-first: all data stays on the device.

## Current status

Implemented:

- Themed app shell (paper tones, sage green, serif titles) with header, time-based greeting and three tabs: `Semana`, `Compras`, `Manutenção`.
- App icon and native splash screen.

Planned (see `docs/specs/001-life-plan-app.md`): weekly planner with recurring and one-off activities, shopping list by house, house management, backup/restore/reset of local data. The three tabs are placeholders until those plans are executed.

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
