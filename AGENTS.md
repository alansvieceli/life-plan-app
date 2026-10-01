# AGENTS.md

## Project

This repository contains `life-plan-app`, a React Native Expo application (Android only) for organizing the user's week and a shopping list split between two houses. It is a single-user, offline-first app: all data stays on the device.

## Main Rule

Do not implement code directly from a vague request.

Always follow this workflow:

1. Read this file.
2. Read `CLAUDE.md` if available.
3. Read the relevant files in `docs/standards/`.
4. Read the active spec in `docs/specs/`.
5. Generate or update a plan in `docs/plans/` when requested.
6. Execute only approved tasks from `docs/tasks/`.
7. Update documentation after changes.

## Standards

Always follow:

- `docs/standards/ai-workflow.md`
- `docs/standards/app-context-policy.md`
- `docs/standards/code-duplication-policy.md`
- `docs/standards/react-native-standards.md`
- `docs/standards/readme-policy.md`
- `docs/standards/spec-completion-policy.md`
- `docs/standards/testing-policy.md`
- `docs/standards/ui-copy-policy.md`

## Project Constraints

- Use React Native with Expo.
- Use TypeScript (strict).
- Use Biome for lint and format, and Knip for unused code and dependencies.
- Target Android only (emulator first).
- Store all data locally on the device. Do not add backend code.
- Provide a maintenance section with backup and restore of local data.
- Do not add authentication.
- Do not add paid services.
- Do not add unnecessary dependencies.
- Keep the project simple and maintainable.

## Expected Workflow

Spec first.
Plan second.
Task execution third.

Never skip the plan when implementation requires multiple steps.

## Validation

When code exists, validate with the available project commands.

Preferred validations:

- TypeScript check
- lint
- unit tests
- Expo start validation when applicable

If a command does not exist yet, document that it is not available instead of inventing one.
