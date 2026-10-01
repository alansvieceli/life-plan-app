# Code Duplication Policy

## Limit

Duplicated lines in `src/` must stay at or below **5%**, as measured by `jscpd`.

## How to Measure

```bash
npx jscpd src --min-tokens 50 --threshold 5
```

- `--min-tokens 50` ignores small incidental repetitions.
- `--threshold 5` makes the command fail when duplication exceeds 5%, so it can gate CI or local validation.

## Rules

- Run the duplication check before closing any spec that adds or changes UI components or screens.
- New code must not introduce clones of 12 lines or more; extract a shared component, helper, or hook instead.
- Repeated UI structures (modal overlay/card/actions, form fields, list rows) belong in shared components under `src/components/common/`.
- Shared styles belong in `src/theme/`.
- Test fixtures may repeat when extraction would hurt test readability; prefer factory helpers when a fixture is cloned three or more times.
- When a refactor to remove duplication is too large for the current task, document it as a pending item instead of ignoring it.

## Current Baseline

2026-10-01 (plan 002): 0 clones, 0% duplicated lines (23 files, 1429 lines in `src/`).
