import type { AppState, Task } from './appState';
import { toDateKey } from './dates';

export function addTask(
  state: AppState,
  id: string,
  title: string,
  date: string,
): AppState {
  const trimmed = title.trim();
  if (trimmed === '') return state;
  return {
    ...state,
    tasks: [...state.tasks, { id, title: trimmed, date, done: false }],
  };
}

export function updateTask(
  state: AppState,
  id: string,
  title: string,
  date: string,
): AppState {
  const trimmed = title.trim();
  if (trimmed === '') return state;
  return {
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, title: trimmed, date } : task,
    ),
  };
}

export function toggleTask(state: AppState, id: string): AppState {
  return {
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, done: !task.done } : task,
    ),
  };
}

export function deleteTask(state: AppState, id: string): AppState {
  return { ...state, tasks: state.tasks.filter((task) => task.id !== id) };
}

export function tasksForDate(state: AppState, dateKey: string): Task[] {
  const tasks = state.tasks.filter((task) => task.date === dateKey);
  return [...tasks.filter((task) => !task.done), ...tasks.filter((task) => task.done)];
}

export function hasPendingTask(state: AppState, dateKey: string): boolean {
  return state.tasks.some((task) => task.date === dateKey && !task.done);
}

// Date keys are zero-padded YYYY-MM-DD, so string order is date order.
export function rollOverTasks(state: AppState, today: Date): AppState {
  const todayKey = toDateKey(today);
  if (!state.tasks.some((task) => !task.done && task.date < todayKey)) return state;
  return {
    ...state,
    tasks: state.tasks.map((task) =>
      !task.done && task.date < todayKey ? { ...task, date: todayKey } : task,
    ),
  };
}
