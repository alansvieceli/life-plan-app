# App Context Policy

## Goal

Keep `docs/app-context.md` as the canonical product and project context for AI agents and contributors who need to understand the app quickly.

## Required Updates

Update `docs/app-context.md` whenever a change affects:

- app purpose, positioning, or target user.
- primary navigation tabs or secondary views.
- user-visible app behavior.
- planner concepts, such as activities, start time, duration, weekdays, houses, or shopping items.
- local data behavior, including storage, backup, restore, reset, migration, or data validation.
- branding that changes how the app is identified.
- project constraints or workflow rules that future agents must know.

## README Relationship

The README remains the main human entry point.

Update `README.md` in the same task when a change affects:

- user-facing app behavior.
- setup, install, development, build, or validation commands.
- dependencies.
- app navigation or major product capabilities.
- local data, backup, restore, or reset behavior.

## Rules

- Keep `docs/app-context.md` in English.
- Keep `docs/app-context.md` focused on implemented behavior.
- Do not copy full specs into `docs/app-context.md`.
- Prefer concise summaries with links or references to detailed specs when needed.
- If a feature is planned but not implemented, clearly mark it as planned or omit it.
- When closing a spec that changes app behavior, confirm whether `docs/app-context.md` and README need updates.
