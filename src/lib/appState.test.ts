import { createDefaultState, parseStoredState, validateAppState } from './appState';
import { createSampleState } from './stateFixtures';

describe('createDefaultState', () => {
  it('has two houses and empty lists', () => {
    const state = createDefaultState();
    expect(state.houses.map((house) => house.name)).toEqual(['Casa 1', 'Casa 2']);
    expect(state.routines).toEqual([]);
    expect(state.oneOffs).toEqual([]);
    expect(state.shoppingItems).toEqual([]);
  });
});

describe('validateAppState', () => {
  it('accepts a valid state unchanged', () => {
    const sample = createSampleState();
    expect(validateAppState(sample)).toEqual({ ok: true, state: sample });
  });

  it('trims house names and titles', () => {
    const sample = createSampleState();
    sample.houses[0].name = '  Casa 1  ';
    sample.routines[0].title = ' Trabalhar ';
    const check = validateAppState(sample);
    expect(check.ok && check.state.houses[0].name).toBe('Casa 1');
    expect(check.ok && check.state.routines[0].title).toBe('Trabalhar');
  });

  it.each([null, 'text', 42, []])('rejects a non-object (%p)', (value) => {
    expect(validateAppState(value)).toEqual({ ok: false, reason: 'shape' });
  });

  const invalidShapes: [
    string,
    (s: ReturnType<typeof createSampleState>) => unknown,
  ][] = [
    ['no houses', (s) => ({ ...s, houses: [] })],
    ['blank house name', (s) => ({ ...s, houses: [{ id: 'house-a', name: '  ' }] })],
    ['routines not an array', (s) => ({ ...s, routines: 'x' })],
    [
      'weekday out of range',
      (s) => ({ ...s, routines: [{ ...s.routines[0], weekdays: [7] }] }),
    ],
    [
      'empty weekdays',
      (s) => ({ ...s, routines: [{ ...s.routines[0], weekdays: [] }] }),
    ],
    [
      'bad time',
      (s) => ({ ...s, routines: [{ ...s.routines[0], startTime: '24:00' }] }),
    ],
    [
      'zero duration',
      (s) => ({ ...s, routines: [{ ...s.routines[0], durationMin: 0 }] }),
    ],
    [
      'duration over a day',
      (s) => ({ ...s, routines: [{ ...s.routines[0], durationMin: 1441 }] }),
    ],
    [
      'impossible date',
      (s) => ({ ...s, oneOffs: [{ ...s.oneOffs[0], date: '2026-02-30' }] }),
    ],
    [
      'bought not boolean',
      (s) => ({
        ...s,
        shoppingItems: [{ ...s.shoppingItems[0], bought: 'yes' }],
      }),
    ],
  ];

  it.each(invalidShapes)('rejects %s', (_name, mutate) => {
    expect(validateAppState(mutate(createSampleState()))).toEqual({
      ok: false,
      reason: 'shape',
    });
  });

  it('rejects an item that points to a missing house', () => {
    const sample = createSampleState();
    sample.shoppingItems[0].houseId = 'house-zzz';
    expect(validateAppState(sample)).toEqual({ ok: false, reason: 'references' });
  });
});

describe('parseStoredState', () => {
  it('returns the default state when nothing is stored', () => {
    expect(parseStoredState(null)).toEqual({
      state: createDefaultState(),
      wasInvalid: false,
    });
  });

  it('returns the stored state when it is valid', () => {
    const sample = createSampleState();
    expect(parseStoredState(JSON.stringify(sample))).toEqual({
      state: sample,
      wasInvalid: false,
    });
  });

  it('flags text that is not JSON', () => {
    expect(parseStoredState('{oops')).toEqual({
      state: createDefaultState(),
      wasInvalid: true,
    });
  });

  it('flags JSON with the wrong shape', () => {
    expect(parseStoredState('{"houses":[]}')).toEqual({
      state: createDefaultState(),
      wasInvalid: true,
    });
  });
});
