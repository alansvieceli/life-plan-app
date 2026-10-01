# App Context

## Purpose

Life Plan is a personal Android app (React Native, Expo, TypeScript) for one user. It helps organize the week and keep a shopping list split between two houses.

## Status

Implemented: themed app shell with header (app icon, time-based greeting), three tabs (`Semana`, `Compras`, `Manutenção`) with placeholder content, app icon, and native splash. The planner, shopping list and maintenance features below are still planned (spec `docs/specs/001-life-plan-app.md`).

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
