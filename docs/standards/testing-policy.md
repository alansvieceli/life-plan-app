# Testing Policy

## Default Rule

Add or update unit tests for business logic.

## Required Test Areas

Unit tests are required for:

- schedule logic (start time, duration, end time, overlaps, weekday grouping)
- shopping list logic (grouping and splitting items by house)
- validation logic
- formatting logic
- date/time logic
- storage adapters, including backup and restore, when possible

## Not Required Initially

Tests are not mandatory for:

- purely visual components
- static layout
- simple style changes
- generated configuration files

## Validation

When tests exist, run them before marking a task as complete.
