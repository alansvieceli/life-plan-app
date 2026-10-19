# Plan 006 - Past Events Retention

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Delete one-off activities older than a configurable number of days (default 10) on app start and when the user shortens the period, with the period chosen in the Maintenance tab.

**Architecture:** Pure rules in `src/lib/retention.ts` (settings, `purgeOldOneOffs`, `countExpiredOneOffs`), unit tested. `useAppState` gains a purge action and a count helper that go through the existing `update`. The period is a device setting stored with `useDeviceSetting` from plan 005. `LifePlanApp` runs the start-up cleanup exactly once; `RetentionSection` is the UI and `MaintenanceScreen` handles the confirmation.

**Tech Stack:** Expo SDK 56, React Native 0.85, TypeScript strict, Jest (`jest-expo`), Biome, Knip. No new dependencies.

**Spec:** `docs/specs/003-past-events-retention.md`. Depends on plan 005 (`useDeviceSetting`, `ChipRow` is reused as-is).

## Global Constraints

- Android only; no backend; all data on the device; no new dependencies.
- TypeScript strict, no `any`; Biome single quotes, 2 spaces, line width 88; `npm run check` green; `src/lib/` coverage above 80%; duplication at or below 5% (`npm run dup`).
- Standards: `docs/standards/react-native-standards.md`, `docs/standards/ui-copy-policy.md` (pt-BR sentence case).
- Retention options `7, 10, 15, 30, 60` days, default 10; setting key `@life-plan-app/retention/v1`; not part of the backup file; the backup format and `AppState` do not change.
- Rule: with `cutoff = today - keepDays` days, a one-off is deleted when its date is before `cutoff`. Today, future one-offs, routines, houses and shopping items are never deleted.
- The cleanup runs on app start (once) and when the user changes the period; never after a backup restore.
- Commits `type: message`, ending with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; the merge commit uses `chore:`.
- Work on branch `feat/past-events-retention` created from `master` after plan 005 is merged.

## Review Focus

- The boundary day is kept and the day before it is deleted, including across a month and year boundary (Task 1 tests).
- Nothing expired returns the same state object, so no save and no re-render happen (Task 1 test).
- An empty `oneOffs` list and a state with only routines are untouched (Task 1 test).
- Corrupt or missing stored settings fall back to 10 days (Task 1 test).
- The start-up cleanup runs once only: adding an old one-off in the form is not deleted until the next start (Task 2, manual).
- Shortening the period with nothing to delete does not show a confirmation; declining the confirmation keeps both the old period and the data (Task 2, manual).
- A failed read of the stored data (`canSave` false in `useAppState`) never wipes stored data through the cleanup (Task 2: the cleanup goes through `update`, which already refuses to save).

---

### Task 1: Retention rules (TDD)

**Files:** Create `src/lib/retention.ts`, `src/lib/retention.test.ts`.

**Interfaces (produces):**
- `type RetentionSettings = { keepDays: number }`, `RETENTION_DAYS_OPTIONS = [7, 10, 15, 30, 60] as const`, `DEFAULT_RETENTION_SETTINGS`, `normalizeRetentionSettings(raw: unknown): RetentionSettings`.
- `purgeOldOneOffs(state: AppState, keepDays: number, today: Date): AppState` (same object when nothing expires).
- `countExpiredOneOffs(state: AppState, keepDays: number, today: Date): number`.

- [ ] **Step 1: Write the failing tests** in `src/lib/retention.test.ts`:

```ts
import { type AppState, createDefaultState } from './appState';
import {
  countExpiredOneOffs,
  DEFAULT_RETENTION_SETTINGS,
  normalizeRetentionSettings,
  purgeOldOneOffs,
} from './retention';
import { createSampleState } from './stateFixtures';

const oneOff = (id: string, date: string) => ({
  id,
  title: id,
  date,
  startTime: '10:00',
  durationMin: 60,
});
const stateWith = (dates: string[]): AppState => ({
  ...createSampleState(),
  oneOffs: dates.map((date, index) => oneOff(`o${index}`, date)),
});

describe('normalizeRetentionSettings', () => {
  it('returns 10 days for missing or invalid values', () => {
    expect(normalizeRetentionSettings(undefined)).toEqual(DEFAULT_RETENTION_SETTINGS);
    expect(normalizeRetentionSettings({ keepDays: 3 })).toEqual(
      DEFAULT_RETENTION_SETTINGS,
    );
    expect(normalizeRetentionSettings({ keepDays: '30' })).toEqual(
      DEFAULT_RETENTION_SETTINGS,
    );
    expect(DEFAULT_RETENTION_SETTINGS).toEqual({ keepDays: 10 });
  });

  it('keeps a valid value', () => {
    expect(normalizeRetentionSettings({ keepDays: 30 })).toEqual({ keepDays: 30 });
  });
});

describe('purgeOldOneOffs', () => {
  const today = new Date(2026, 9, 20);

  it('keeps the boundary day and deletes the day before it', () => {
    const next = purgeOldOneOffs(stateWith(['2026-10-10', '2026-10-09']), 10, today);
    expect(next.oneOffs.map((entry) => entry.date)).toEqual(['2026-10-10']);
  });

  it('keeps today and future one-offs', () => {
    const next = purgeOldOneOffs(stateWith(['2026-10-20', '2026-12-01']), 7, today);
    expect(next.oneOffs).toHaveLength(2);
  });

  it('does not touch routines, houses or shopping items', () => {
    const state = stateWith(['2020-01-01']);
    const next = purgeOldOneOffs(state, 10, today);
    expect(next.oneOffs).toEqual([]);
    expect(next.routines).toBe(state.routines);
    expect(next.houses).toBe(state.houses);
    expect(next.shoppingItems).toBe(state.shoppingItems);
  });

  it('returns the same object when nothing expires', () => {
    const state = stateWith(['2026-10-15']);
    expect(purgeOldOneOffs(state, 10, today)).toBe(state);
    const empty = createDefaultState();
    expect(purgeOldOneOffs(empty, 10, today)).toBe(empty);
  });

  it('works across a month and year boundary', () => {
    const next = purgeOldOneOffs(
      stateWith(['2025-12-26', '2025-12-25']),
      10,
      new Date(2026, 0, 5),
    );
    expect(next.oneOffs.map((entry) => entry.date)).toEqual(['2025-12-26']);
  });
});

describe('countExpiredOneOffs', () => {
  it('matches what purgeOldOneOffs removes', () => {
    const state = stateWith(['2026-10-01', '2026-10-09', '2026-10-10', '2026-10-25']);
    const today = new Date(2026, 9, 20);
    const removed =
      state.oneOffs.length - purgeOldOneOffs(state, 10, today).oneOffs.length;
    expect(countExpiredOneOffs(state, 10, today)).toBe(removed);
    expect(removed).toBe(2);
  });
});
```

- [ ] **Step 2: Run** `npx jest src/lib/retention`; expect FAIL (module missing).
- [ ] **Step 3: Implement** `src/lib/retention.ts`:

```ts
import { type AppState, isRecord } from './appState';
import { addDays, toDateKey } from './dates';

export type RetentionSettings = { keepDays: number };

export const RETENTION_DAYS_OPTIONS = [7, 10, 15, 30, 60] as const;

export const DEFAULT_RETENTION_SETTINGS: RetentionSettings = { keepDays: 10 };

export function normalizeRetentionSettings(raw: unknown): RetentionSettings {
  if (!isRecord(raw)) return DEFAULT_RETENTION_SETTINGS;
  const keepDays = RETENTION_DAYS_OPTIONS.find((option) => option === raw.keepDays);
  return { keepDays: keepDays ?? DEFAULT_RETENTION_SETTINGS.keepDays };
}

// Date keys are zero-padded YYYY-MM-DD, so string order is date order.
function keptOneOffs(state: AppState, keepDays: number, today: Date) {
  const cutoff = toDateKey(addDays(today, -keepDays));
  return state.oneOffs.filter((oneOff) => oneOff.date >= cutoff);
}

export function purgeOldOneOffs(
  state: AppState,
  keepDays: number,
  today: Date,
): AppState {
  const kept = keptOneOffs(state, keepDays, today);
  return kept.length === state.oneOffs.length ? state : { ...state, oneOffs: kept };
}

export function countExpiredOneOffs(
  state: AppState,
  keepDays: number,
  today: Date,
): number {
  return state.oneOffs.length - keptOneOffs(state, keepDays, today).length;
}
```

- [ ] **Step 4: Run** `npx jest src/lib/retention`; expect PASS.
- [ ] **Step 5:** `npm run fix`; commit on a new branch:

```bash
git switch -c feat/past-events-retention
git add src/lib/retention.ts src/lib/retention.test.ts
git commit -m "feat: add past events retention rules"
```

### Task 2: Retention UI, store actions and start-up cleanup

**Files:** Create `src/components/maintenance/RetentionSection.tsx`; modify `src/hooks/useAppState.ts`, `src/components/maintenance/MaintenanceScreen.tsx`, `src/LifePlanApp.tsx`.

**Interfaces (consumes):** `useDeviceSetting`, `DeviceSetting<T>` (plan 005), `confirmAction`, `ChipRow`, `SectionCard`, the retention helpers from Task 1.
**Interfaces (produces):** `useAppState` gains `purgeOldOneOffs(keepDays: number): void` and `countExpiredOneOffs(keepDays: number): number`.

- [ ] **Step 1: Store actions** in `src/hooks/useAppState.ts`. Import with aliases to avoid clashing with the action names:

```ts
import {
  countExpiredOneOffs as countExpired,
  purgeOldOneOffs as purgeOneOffs,
} from '../lib/retention';
```

Add to the returned object (after `deleteActivity`):

```ts
    purgeOldOneOffs: (keepDays: number) => {
      const next = purgeOneOffs(state, keepDays, new Date());
      if (next !== state) update(next);
    },
    countExpiredOneOffs: (keepDays: number) => countExpired(state, keepDays, new Date()),
```

- [ ] **Step 2: Implement** `src/components/maintenance/RetentionSection.tsx`:

```tsx
import { StyleSheet, Text } from 'react-native';

import { RETENTION_DAYS_OPTIONS } from '../../lib/retention';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ChipRow } from '../common/ChipRow';
import { SectionCard } from '../common/SectionCard';

type RetentionSectionProps = {
  keepDays: number;
  onSelect: (keepDays: number) => void;
};

const options = RETENTION_DAYS_OPTIONS.map((days) => ({
  id: String(days),
  label: `${days} dias`,
}));

export function RetentionSection({ keepDays, onSelect }: RetentionSectionProps) {
  return (
    <SectionCard title="Histórico">
      <Text style={styles.note}>Manter eventos passados por</Text>
      <ChipRow
        onSelect={(id) => onSelect(Number(id))}
        options={options}
        selectedId={String(keepDays)}
      />
      <Text style={styles.note}>
        Eventos avulsos mais antigos são apagados automaticamente.
      </Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  note: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
});
```

- [ ] **Step 3: Wire `MaintenanceScreen`** (`src/components/maintenance/MaintenanceScreen.tsx`). Add the prop (type from plan 005's `DeviceSetting`):

```tsx
import type { DeviceSetting } from '../../hooks/useDeviceSetting';
import type { RetentionSettings } from '../../lib/retention';
import { RetentionSection } from './RetentionSection';

export function MaintenanceScreen({
  store,
  reminders,
  retention,
}: {
  store: AppStore;
  reminders: RemindersStore;
  retention: DeviceSetting<RetentionSettings>;
}) {
```

Add the handler next to the other `handle...` functions:

```tsx
  async function handleKeepDays(keepDays: number) {
    const expired = store.countExpiredOneOffs(keepDays);
    if (expired > 0) {
      const confirmed = await confirmAction(
        'Apagar eventos antigos',
        `Apagar ${expired} evento(s) avulso(s) mais antigo(s) que ${keepDays} dias?`,
        'Apagar',
      );
      if (!confirmed) return;
    }
    await retention.save({ keepDays });
    store.purgeOldOneOffs(keepDays);
  }
```

Render the section between `RemindersSection` and `DataSection`:

```tsx
      <RetentionSection
        keepDays={retention.value.keepDays}
        onSelect={handleKeepDays}
      />
```

- [ ] **Step 4: Wire `LifePlanApp`** (`src/LifePlanApp.tsx`): import `useRef`, `useDeviceSetting` and the retention helpers; create the setting beside the other hooks; add the one-time cleanup effect before `if (!isReady) return null;`; pass the prop.

```tsx
import { useDeviceSetting } from './hooks/useDeviceSetting';
import {
  DEFAULT_RETENTION_SETTINGS,
  normalizeRetentionSettings,
} from './lib/retention';

const RETENTION_KEY = '@life-plan-app/retention/v1';
```

```tsx
  const retention = useDeviceSetting(
    RETENTION_KEY,
    DEFAULT_RETENTION_SETTINGS,
    normalizeRetentionSettings,
  );
  const hasPurged = useRef(false);

  // Cleanup runs once per start, after both the data and the period are loaded.
  useEffect(() => {
    if (hasPurged.current || !store.isLoaded || !retention.isLoaded) return;
    hasPurged.current = true;
    store.purgeOldOneOffs(retention.value.keepDays);
  }, [store, retention.isLoaded, retention.value.keepDays]);
```

```tsx
        {activeTab === 'maintenance' ? (
          <MaintenanceScreen reminders={reminders} retention={retention} store={store} />
        ) : null}
```

`store` as a dependency changes on every render, so the effect re-runs but returns immediately through the `hasPurged` guard.

- [ ] **Step 5:** `npm run fix && npm run check && npm run dup`; expect green, 0 new clones. `npx expo export --platform android`; expect bundle OK.
- [ ] **Step 6:** Commit `feat: add past events retention to maintenance`.

### Task 3: Manual check, documentation and merge

- [ ] **Manual check** (left to the user when no device is available): create a one-off dated 12 days ago (form date arrows) and one 5 days ago; it stays until the next start; restart the app and confirm the 12-day-old one is gone and the 5-day-old one remains; in `Histórico` choose `7 dias` and confirm the prompt shows the right count, `Cancelar` keeps everything and the old period, `Apagar` removes them; choose `30 dias` and confirm no prompt and nothing deleted; restore a backup containing old one-offs and confirm they remain until the next start.
- [ ] Update `README.md` (retention implemented), `docs/app-context.md` (Status, retention concept, setting key, that the cleanup only touches one-offs and the setting is outside the backup) and the coverage and duplication baselines wherever `docs/quality/` records them.
- [ ] Run `npm run check` and `npm run dup`; expect green (spec completion policy).
- [ ] Commit `docs: document past events retention`, then merge into `master` with a `chore: merge past events retention` commit.
