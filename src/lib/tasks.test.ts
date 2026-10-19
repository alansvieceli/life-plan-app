import type { AppState, Task } from './appState';
import { createSampleState } from './stateFixtures';
import {
  addTask,
  deleteTask,
  hasPendingTask,
  rollOverTasks,
  tasksForDate,
  toggleTask,
  updateTask,
} from './tasks';

const task = (id: string, date: string, done = false): Task => ({
  id,
  title: id,
  date,
  done,
});
const stateWith = (tasks: Task[]): AppState => ({ ...createSampleState(), tasks });

describe('addTask', () => {
  it('trims the title and appends a pending task', () => {
    const next = addTask(stateWith([]), 't1', '  Ligar  ', '2026-10-20');
    expect(next.tasks).toEqual([
      { id: 't1', title: 'Ligar', date: '2026-10-20', done: false },
    ]);
  });

  it('ignores an empty title', () => {
    const state = stateWith([]);
    expect(addTask(state, 't1', '   ', '2026-10-20')).toBe(state);
  });
});

describe('updateTask', () => {
  it('changes title and date', () => {
    const next = updateTask(
      stateWith([task('a', '2026-10-20')]),
      'a',
      ' Novo ',
      '2026-10-21',
    );
    expect(next.tasks[0]).toEqual({
      id: 'a',
      title: 'Novo',
      date: '2026-10-21',
      done: false,
    });
  });

  it('ignores an empty title', () => {
    const state = stateWith([task('a', '2026-10-20')]);
    expect(updateTask(state, 'a', ' ', '2026-10-21')).toBe(state);
  });
});

describe('toggleTask and deleteTask', () => {
  it('toggles twice back to the original', () => {
    const state = stateWith([task('a', '2026-10-20')]);
    expect(toggleTask(state, 'a').tasks[0].done).toBe(true);
    expect(toggleTask(toggleTask(state, 'a'), 'a').tasks).toEqual(state.tasks);
  });

  it('deletes only the given id', () => {
    const state = stateWith([task('a', '2026-10-20'), task('b', '2026-10-20')]);
    expect(deleteTask(state, 'a').tasks.map((t) => t.id)).toEqual(['b']);
  });
});

describe('tasksForDate and hasPendingTask', () => {
  const state = stateWith([
    task('a', '2026-10-20', true),
    task('b', '2026-10-20'),
    task('c', '2026-10-20'),
    task('d', '2026-10-21'),
  ]);

  it('lists pending first, done last, only for that day', () => {
    expect(tasksForDate(state, '2026-10-20').map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('flags only days with a pending task', () => {
    expect(hasPendingTask(state, '2026-10-20')).toBe(true);
    expect(
      hasPendingTask(stateWith([task('a', '2026-10-20', true)]), '2026-10-20'),
    ).toBe(false);
    expect(hasPendingTask(state, '2026-10-30')).toBe(false);
  });
});

describe('rollOverTasks', () => {
  const today = new Date(2026, 9, 20);

  it('moves a pending past task to today', () => {
    const next = rollOverTasks(stateWith([task('a', '2026-10-19')]), today);
    expect(next.tasks[0].date).toBe('2026-10-20');
  });

  it('keeps done past tasks, today and future tasks', () => {
    const state = stateWith([
      task('a', '2026-10-19', true),
      task('b', '2026-10-20'),
      task('c', '2026-10-25'),
    ]);
    expect(rollOverTasks(state, today)).toBe(state);
  });

  it('returns the same object for an empty list', () => {
    const state = stateWith([]);
    expect(rollOverTasks(state, today)).toBe(state);
  });

  it('works across a year boundary and keeps other lists', () => {
    const state = stateWith([task('a', '2025-12-31')]);
    const next = rollOverTasks(state, new Date(2026, 0, 1));
    expect(next.tasks[0].date).toBe('2026-01-01');
    expect(next.shoppingItems).toBe(state.shoppingItems);
  });

  it('changes only the pending past tasks of a mixed list', () => {
    const state = stateWith([task('a', '2026-10-01'), task('b', '2026-10-01', true)]);
    const next = rollOverTasks(state, today);
    expect(next.tasks.map((t) => t.date)).toEqual(['2026-10-20', '2026-10-01']);
  });
});
