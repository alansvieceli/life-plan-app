import type { AppState } from './appState';

type DraftBase = { title: string; startTime: string; durationMin: number };

export type ActivityDraft = DraftBase &
  ({ kind: 'routine'; weekdays: number[] } | { kind: 'oneoff'; date: string });

function replaceOrAppend<T extends { id: string }>(list: T[], item: T) {
  return list.some((entry) => entry.id === item.id)
    ? list.map((entry) => (entry.id === item.id ? item : entry))
    : [...list, item];
}

export function upsertActivity(
  state: AppState,
  id: string,
  draft: ActivityDraft,
): AppState {
  const { title, startTime, durationMin } = draft;
  if (draft.kind === 'routine') {
    const routine = { id, title, startTime, durationMin, weekdays: draft.weekdays };
    return { ...state, routines: replaceOrAppend(state.routines, routine) };
  }
  const oneOff = { id, title, startTime, durationMin, date: draft.date };
  return { ...state, oneOffs: replaceOrAppend(state.oneOffs, oneOff) };
}

export function removeActivity(
  state: AppState,
  kind: 'routine' | 'oneoff',
  id: string,
): AppState {
  return kind === 'routine'
    ? { ...state, routines: state.routines.filter((routine) => routine.id !== id) }
    : { ...state, oneOffs: state.oneOffs.filter((oneOff) => oneOff.id !== id) };
}
