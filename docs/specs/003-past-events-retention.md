# Spec 003 - Past Events Retention

## Objective

Keep past one-off activities only for a configurable number of days (default 10) and delete older ones automatically, so the stored data does not accumulate. The retention period is configured in the Maintenance tab.

## Context

- Single user, Android only, offline-first. All data stays on the device.
- Today nothing is ever deleted automatically: a one-off stays in `AppState.oneOffs` forever until the user removes it. Routines are weekly templates (not per-occurrence records), so they have nothing to expire.
- The week screen can navigate to past weeks and shows the one-offs of those days, so retention directly defines how far back the user can look.
- UI copy is Brazilian Portuguese, sentence case, per `docs/standards/ui-copy-policy.md`.

## Goals

- One-off activities whose date is older than the retention period are deleted automatically.
- The retention period is configurable in the Maintenance tab, default 10 days.

## Non-goals

- Routines are never deleted or changed by retention.
- No history of routine occurrences and no "done" state (still out of scope).
- Shopping items and houses are not affected.
- No "keep forever" option and no undo for the automatic deletion.
- No change to the backup format. The retention setting is a device setting and is not part of the backup file.
- No notifications about the cleanup.

## Settings

Stored in AsyncStorage under `@life-plan-app/retention/v1`, separately from `@life-plan-app/state/v1` (same separation as the reminder settings in spec 002):

```ts
type RetentionSettings = {
  keepDays: number; // one of 7, 10, 15, 30, 60; default 10
};
```

Invalid or missing stored values fall back to the default (`normalizeRetentionSettings`).

## Retention Rule

With `today` being the local date at the moment of the cleanup, a one-off is deleted when its date is **before** `today - keepDays` days. Examples with `keepDays = 10` and `today = 2026-10-20`: a one-off on `2026-10-10` is kept; one on `2026-10-09` is deleted. Today and future one-offs are never deleted.

## UX Behavior

### Maintenance tab: `Histórico` section

A new section with a chip row `Manter eventos passados por` with `7 dias`, `10 dias`, `15 dias`, `30 dias` and `60 dias`, and a short hint: `Eventos avulsos mais antigos são apagados automaticamente.`

Choosing a shorter period deletes the now-expired one-offs right away. A confirmation is asked before that happens only when at least one one-off would be deleted (`Apagar N evento(s) avulso(s) mais antigo(s) que X dias?`). Declining keeps the previous period. Choosing a longer period deletes nothing.

## Cleanup Logic

A pure function `purgeOldOneOffs(state, keepDays, today)` returns a new state without the expired one-offs, or the **same state object** when nothing expires (so no save and no re-render are triggered).

The cleanup runs:

- on app start, once both the stored data and the retention settings have finished loading;
- when the user changes the retention period (after the confirmation above).

It does **not** run after a backup restore: a restored backup keeps its old one-offs until the next app start. This avoids a restore that appears to lose data immediately.

## Implementation Notes

- `src/lib/retention.ts` (pure): `RetentionSettings`, `DEFAULT_RETENTION_SETTINGS`, `RETENTION_DAYS_OPTIONS`, `normalizeRetentionSettings`, `purgeOldOneOffs`, `countExpiredOneOffs`. Reuse the date helpers in `src/lib/dates.ts`. No React or Expo imports.
- Settings are loaded and saved with the shared `useDeviceSetting` hook from spec 002 (no retention-specific storage module or hook).
- `useAppState`: a `purgeOldOneOffs(keepDays)` action that goes through the existing `update` (so it persists).
- `src/components/maintenance/RetentionSection.tsx`: the UI, using `SectionCard` and `ChipRow`, wired in `MaintenanceScreen`.
- `LifePlanApp.tsx`: an effect that calls the store action when `store.isLoaded` and the retention settings are loaded.
- Spec 002 reschedules reminders when one-offs change, so a cleanup that removes events also keeps the reminders in sync. Expired one-offs are in the past, so they never had a pending reminder.

## Tests

Unit tests for `retention.ts`:

- `normalizeRetentionSettings` returns the default for missing, invalid or out-of-list values.
- A one-off exactly `keepDays` days old is kept; one day older is deleted.
- Today and future one-offs are kept.
- Routines, houses and shopping items are untouched.
- Returns the same state object when nothing expires.
- Month and year boundaries (e.g. `today = 2026-01-05`, `keepDays = 10`).
- `countExpiredOneOffs` matches what `purgeOldOneOffs` removes.

## Acceptance Criteria

- The Maintenance tab has a `Histórico` section with the retention chips; default is 10 days.
- On app start, one-offs older than the retention period are deleted and the deletion is persisted.
- Shortening the period asks for confirmation when something would be deleted, and deletes the expired one-offs only after confirming.
- Lengthening the period deletes nothing.
- Routines, shopping items and houses are never affected.
- The retention setting persists locally and is not part of the backup file.
- Restoring a backup does not delete anything until the next app start.
- `npm run check` passes and `src/lib/` coverage stays above 80%.

## Validation

```bash
npm run check
```
