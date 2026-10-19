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

// Covers past one-offs and done tasks; pending tasks and print items never expire.
// Date keys are zero-padded YYYY-MM-DD, so string order is date order.
function kept(state: AppState, keepDays: number, today: Date) {
  const cutoff = toDateKey(addDays(today, -keepDays));
  return {
    oneOffs: state.oneOffs.filter((oneOff) => oneOff.date >= cutoff),
    tasks: state.tasks.filter((task) => !task.done || task.date >= cutoff),
  };
}

export function purgeOldOneOffs(
  state: AppState,
  keepDays: number,
  today: Date,
): AppState {
  const { oneOffs, tasks } = kept(state, keepDays, today);
  if (oneOffs.length === state.oneOffs.length && tasks.length === state.tasks.length) {
    return state;
  }
  return { ...state, oneOffs, tasks };
}

export function countExpiredOneOffs(
  state: AppState,
  keepDays: number,
  today: Date,
): number {
  const { oneOffs, tasks } = kept(state, keepDays, today);
  return state.oneOffs.length - oneOffs.length + state.tasks.length - tasks.length;
}
