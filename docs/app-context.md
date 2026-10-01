# App Context

## Purpose

Life Plan is a personal Android app (React Native, Expo, TypeScript) for one user. It helps organize the week and keep a shopping list split across houses.

## Status

Implemented: themed app shell with header (app icon, time-based greeting), three tabs (`Semana`, `Compras`, `Manutenção`), app icon, native splash held until saved data loads, and the `Manutenção` tab (houses, backup, restore, reset). `Semana` and `Compras` still show placeholders. The planner and shopping list below are planned (spec `docs/specs/001-life-plan-app.md`).

## Data

One JSON state document in AsyncStorage (`houses`, `routines`, `oneOffs`, `shoppingItems`). Houses are a free list with at least one (default `Casa 1` and `Casa 2`); a house with shopping items cannot be deleted. Backups are `.lpb` JSON files with a SHA-256 integrity hash; restore validates everything first and is atomic. Reset returns to the default state.

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
