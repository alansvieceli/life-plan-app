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

describe('done tasks', () => {
  const today = new Date(2026, 9, 20);
  const task = (id: string, date: string, done: boolean) => ({
    id,
    title: id,
    date,
    done,
  });
  const withTasks = (tasks: ReturnType<typeof task>[]): AppState => ({
    ...createDefaultState(),
    tasks,
  });

  it('keeps a done task exactly keepDays old and deletes one day older', () => {
    const state = withTasks([
      task('edge', '2026-10-10', true),
      task('old', '2026-10-09', true),
    ]);
    expect(purgeOldOneOffs(state, 10, today).tasks.map((t) => t.id)).toEqual(['edge']);
  });

  it('never deletes pending tasks or print items', () => {
    const state = {
      ...withTasks([task('pending', '2020-01-01', false)]),
      printItems: createSampleState().printItems,
    };
    expect(purgeOldOneOffs(state, 10, today)).toBe(state);
  });

  it('counts expired one-offs and done tasks together', () => {
    const state = {
      ...stateWith(['2026-10-01', '2026-10-15']),
      tasks: [task('a', '2026-10-01', true), task('b', '2026-10-01', false)],
    };
    const removed =
      state.oneOffs.length +
      state.tasks.length -
      (purgeOldOneOffs(state, 10, today).oneOffs.length +
        purgeOldOneOffs(state, 10, today).tasks.length);
    expect(countExpiredOneOffs(state, 10, today)).toBe(2);
    expect(removed).toBe(2);
  });
});
