import { type ActivityDraft, removeActivity, upsertActivity } from './activities';
import { createSampleState } from './stateFixtures';

const routineDraft: ActivityDraft = {
  kind: 'routine',
  title: 'Ler',
  startTime: '14:00',
  durationMin: 60,
  weekdays: [0, 6],
};

const oneOffDraft: ActivityDraft = {
  kind: 'oneoff',
  title: 'Cinema',
  startTime: '19:00',
  durationMin: 120,
  date: '2026-10-09',
};

describe('upsertActivity', () => {
  it('appends a new routine', () => {
    const state = upsertActivity(createSampleState(), 'r2', routineDraft);
    expect(state.routines.map((r) => r.id)).toEqual(['routine-1', 'r2']);
    expect(state.routines[1]).toEqual({
      id: 'r2',
      title: 'Ler',
      startTime: '14:00',
      durationMin: 60,
      weekdays: [0, 6],
    });
  });

  it('appends a new one-off', () => {
    const state = upsertActivity(createSampleState(), 'o2', oneOffDraft);
    expect(state.oneOffs.map((o) => o.id)).toEqual(['oneoff-1', 'o2']);
    expect(state.oneOffs[1].date).toBe('2026-10-09');
  });

  it('replaces an existing activity of the same kind and id', () => {
    const state = upsertActivity(createSampleState(), 'routine-1', routineDraft);
    expect(state.routines).toHaveLength(1);
    expect(state.routines[0].title).toBe('Ler');
  });
});

describe('removeActivity', () => {
  it('removes a routine without touching one-offs', () => {
    const state = removeActivity(createSampleState(), 'routine', 'routine-1');
    expect(state.routines).toEqual([]);
    expect(state.oneOffs).toHaveLength(1);
  });

  it('removes a one-off without touching routines', () => {
    const state = removeActivity(createSampleState(), 'oneoff', 'oneoff-1');
    expect(state.oneOffs).toEqual([]);
    expect(state.routines).toHaveLength(1);
  });
});
