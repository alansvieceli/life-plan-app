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
