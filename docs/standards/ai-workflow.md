# AI Workflow Standard

## Required Flow

All AI-assisted work must follow this order:

1. Spec
2. Plan
3. Task
4. Implementation
5. Validation
6. Documentation update

## Exceptions: UI/UX Corrections

Small, self-contained UI corrections — such as replacing an interaction pattern across existing components — do not require a spec or plan. They must still follow:

1. Brainstorming (evaluate options, get approval)
2. Implementation
3. Validation (TypeScript, tests)
4. Documentation update (update any affected standards)

A UI correction qualifies for this exception when it:

- Does not introduce new behavior or data concepts.
- Does not change navigation structure.
- Is limited to how existing data is presented or selected.

## Rules

- Do not implement code before reading the active spec (or completing brainstorming for corrections).
- Do not implement multiple unrelated tasks at once.
- Do not expand scope without documenting the reason.
- If something is ambiguous, write the assumption in the plan or task file.
- After implementation, summarize:
  - files changed
  - validation executed
  - pending items
