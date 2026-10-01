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
