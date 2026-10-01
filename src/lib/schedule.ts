import type { AppState } from './appState';
import { parseDateKey } from './dates';
import { timeToMinutes } from './formatters';

type ActivityBase = {
  id: string;
  title: string;
  startTime: string;
  durationMin: number;
  overlaps: boolean;
};

export type Activity = ActivityBase &
  ({ kind: 'routine'; weekdays: number[] } | { kind: 'oneoff'; date: string });

function intersects(a: ActivityBase, b: ActivityBase) {
  const aStart = timeToMinutes(a.startTime);
  const bStart = timeToMinutes(b.startTime);
  return aStart < bStart + b.durationMin && bStart < aStart + a.durationMin;
}

export function activitiesForDate(state: AppState, dateKey: string): Activity[] {
  const weekday = parseDateKey(dateKey).getDay();
  const found: Activity[] = [
    ...state.routines
      .filter((routine) => routine.weekdays.includes(weekday))
      .map((routine) => ({ ...routine, kind: 'routine' as const, overlaps: false })),
    ...state.oneOffs
      .filter((oneOff) => oneOff.date === dateKey)
      .map((oneOff) => ({ ...oneOff, kind: 'oneoff' as const, overlaps: false })),
  ];

  found.sort(
    (a, b) =>
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime) ||
      a.title.localeCompare(b.title),
  );
  return found.map((activity) => ({
    ...activity,
    overlaps: found.some((other) => other !== activity && intersects(activity, other)),
  }));
}
