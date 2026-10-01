import { activitiesForDate } from './schedule';
import { createSampleState } from './stateFixtures';

// 2026-10-06 is a Tuesday (weekday 2); the sample routine runs Monday to Friday.
function stateWith(
  routines: ReturnType<typeof createSampleState>['routines'],
  oneOffs: ReturnType<typeof createSampleState>['oneOffs'],
) {
  return { ...createSampleState(), routines, oneOffs };
}

const routine = (
  id: string,
  startTime: string,
  durationMin: number,
  weekdays = [2],
  title = id,
) => ({ id, title, weekdays, startTime, durationMin });

const oneOff = (
  id: string,
  date: string,
  startTime: string,
  durationMin: number,
  title = id,
) => ({ id, title, date, startTime, durationMin });

describe('activitiesForDate', () => {
  it('includes routines only on their weekdays', () => {
    const state = stateWith([routine('r1', '08:00', 60, [1, 3])], []);
    expect(activitiesForDate(state, '2026-10-06')).toEqual([]);
    expect(activitiesForDate(state, '2026-10-07').map((a) => a.id)).toEqual(['r1']);
  });

  it('includes one-offs only on their date', () => {
    const state = stateWith([], [oneOff('o1', '2026-10-06', '15:30', 60)]);
    expect(activitiesForDate(state, '2026-10-06').map((a) => a.id)).toEqual(['o1']);
    expect(activitiesForDate(state, '2026-10-13')).toEqual([]);
  });

  it('interleaves routines and one-offs by start time, then by title', () => {
    const state = stateWith(
      [
        routine('r1', '14:00', 60, [2], 'Ler'),
        routine('r2', '08:00', 60, [2], 'Zumba'),
      ],
      [
        oneOff('o1', '2026-10-06', '08:00', 60, 'Alongar'),
        oneOff('o2', '2026-10-06', '10:00', 30, 'Dentista'),
      ],
    );
    expect(activitiesForDate(state, '2026-10-06').map((a) => a.id)).toEqual([
      'o1',
      'r2',
      'o2',
      'r1',
    ]);
  });

  it('tags each activity with its kind', () => {
    const state = stateWith(
      [routine('r1', '08:00', 60)],
      [oneOff('o1', '2026-10-06', '10:00', 60)],
    );
    expect(activitiesForDate(state, '2026-10-06').map((a) => a.kind)).toEqual([
      'routine',
      'oneoff',
    ]);
  });

  it('flags overlapping activities on both sides', () => {
    const state = stateWith(
      [routine('r1', '20:00', 120)],
      [oneOff('o1', '2026-10-06', '21:00', 60)],
    );
    expect(activitiesForDate(state, '2026-10-06').map((a) => a.overlaps)).toEqual([
      true,
      true,
    ]);
  });

  it('does not flag back-to-back activities', () => {
    const state = stateWith(
      [routine('r1', '08:00', 60)],
      [oneOff('o1', '2026-10-06', '09:00', 60)],
    );
    expect(activitiesForDate(state, '2026-10-06').map((a) => a.overlaps)).toEqual([
      false,
      false,
    ]);
  });
});
