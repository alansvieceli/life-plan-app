import { createDefaultState, parseStoredState, validateAppState } from './appState';
import { createSampleState } from './stateFixtures';

describe('createDefaultState', () => {
  it('has two houses and empty lists', () => {
    const state = createDefaultState();
    expect(state.houses.map((house) => house.name)).toEqual(['Casa 1', 'Casa 2']);
    expect(state.routines).toEqual([]);
    expect(state.oneOffs).toEqual([]);
    expect(state.shoppingItems).toEqual([]);
    expect(state.tasks).toEqual([]);
    expect(state.printItems).toEqual([]);
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
    ['tasks not an array', (s) => ({ ...s, tasks: 'x' })],
    [
      'task with impossible date',
      (s) => ({ ...s, tasks: [{ ...s.tasks[0], date: '2026-02-30' }] }),
    ],
    [
      'task without done',
      (s) => ({ ...s, tasks: [{ id: 't', title: 'x', date: '2026-10-06' }] }),
    ],
    [
      'task with blank title',
      (s) => ({ ...s, tasks: [{ ...s.tasks[0], title: ' ' }] }),
    ],
    ['printItems not an array', (s) => ({ ...s, printItems: {} })],
    [
      'print item with javascript url',
      (s) => ({
        ...s,
        printItems: [{ ...s.printItems[0], url: 'javascript:alert(1)' }],
      }),
    ],
    [
      'print item printed not boolean',
      (s) => ({ ...s, printItems: [{ ...s.printItems[0], printed: 1 }] }),
    ],
  ];

  it.each(invalidShapes)('rejects %s', (_name, mutate) => {
    expect(validateAppState(mutate(createSampleState()))).toEqual({
      ok: false,
      reason: 'shape',
    });
  });

  it('loads a state written before tasks and print items existed', () => {
    const { tasks: _tasks, printItems: _printItems, ...old } = createSampleState();
    const check = validateAppState(old);
    expect(check.ok && check.state.tasks).toEqual([]);
    expect(check.ok && check.state.printItems).toEqual([]);
  });

  it('trims task titles and print item urls', () => {
    const sample = createSampleState();
    sample.tasks[0].title = ' Ligar ';
    sample.printItems[0].url = ' https://a.co ';
    const check = validateAppState(sample);
    expect(check.ok && check.state.tasks[0].title).toBe('Ligar');
    expect(check.ok && check.state.printItems[0].url).toBe('https://a.co');
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

  it('accepts stored JSON without the new lists', () => {
    const { tasks: _tasks, printItems: _printItems, ...old } = createSampleState();
    const loaded = parseStoredState(JSON.stringify(old));
    expect(loaded.wasInvalid).toBe(false);
    expect(loaded.state.tasks).toEqual([]);
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
