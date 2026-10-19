import { isValidUrl } from './printItems';

export type House = { id: string; name: string };

type Routine = {
  id: string;
  title: string;
  weekdays: number[];
  startTime: string;
  durationMin: number;
};

type OneOff = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  durationMin: number;
};

export type ShoppingItem = {
  id: string;
  name: string;
  houseId: string;
  bought: boolean;
};

export type Task = { id: string; title: string; date: string; done: boolean };

export type PrintItem = { id: string; title: string; url: string; printed: boolean };

export type AppState = {
  houses: House[];
  routines: Routine[];
  oneOffs: OneOff[];
  shoppingItems: ShoppingItem[];
  tasks: Task[];
  printItems: PrintItem[];
};

export type StateCheck =
  | { ok: true; state: AppState }
  | { ok: false; reason: 'shape' | 'references' };

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function createDefaultState(): AppState {
  return {
    houses: [
      { id: 'house-default-1', name: 'Casa 1' },
      { id: 'house-default-2', name: 'Casa 2' },
    ],
    routines: [],
    oneOffs: [],
    shoppingItems: [],
    tasks: [],
    printItems: [],
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isDuration(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 1440;
}

function isWeekdays(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)
  );
}

function parseList<T>(value: unknown, parseItem: (item: unknown) => T | null) {
  if (!Array.isArray(value)) return null;
  const parsed: T[] = [];
  for (const item of value) {
    const result = parseItem(item);
    if (result === null) return null;
    parsed.push(result);
  }
  return parsed;
}

function parseHouse(value: unknown): House | null {
  if (!isRecord(value) || !isText(value.id) || !isText(value.name)) return null;
  return { id: value.id, name: value.name.trim() };
}

function parseRoutine(value: unknown): Routine | null {
  if (
    !isRecord(value) ||
    !isText(value.id) ||
    !isText(value.title) ||
    !isWeekdays(value.weekdays) ||
    !isTime(value.startTime) ||
    !isDuration(value.durationMin)
  ) {
    return null;
  }
  return {
    id: value.id,
    title: value.title.trim(),
    weekdays: value.weekdays,
    startTime: value.startTime,
    durationMin: value.durationMin,
  };
}

function parseOneOff(value: unknown): OneOff | null {
  if (
    !isRecord(value) ||
    !isText(value.id) ||
    !isText(value.title) ||
    !isDate(value.date) ||
    !isTime(value.startTime) ||
    !isDuration(value.durationMin)
  ) {
    return null;
  }
  return {
    id: value.id,
    title: value.title.trim(),
    date: value.date,
    startTime: value.startTime,
    durationMin: value.durationMin,
  };
}

function parseShoppingItem(value: unknown): ShoppingItem | null {
  if (
    !isRecord(value) ||
    !isText(value.id) ||
    !isText(value.name) ||
    !isText(value.houseId) ||
    typeof value.bought !== 'boolean'
  ) {
    return null;
  }
  return {
    id: value.id,
    name: value.name.trim(),
    houseId: value.houseId,
    bought: value.bought,
  };
}

function parseTask(value: unknown): Task | null {
  if (
    !isRecord(value) ||
    !isText(value.id) ||
    !isText(value.title) ||
    !isDate(value.date) ||
    typeof value.done !== 'boolean'
  ) {
    return null;
  }
  return {
    id: value.id,
    title: value.title.trim(),
    date: value.date,
    done: value.done,
  };
}

function parsePrintItem(value: unknown): PrintItem | null {
  if (
    !isRecord(value) ||
    !isText(value.id) ||
    !isText(value.title) ||
    typeof value.url !== 'string' ||
    !isValidUrl(value.url) ||
    typeof value.printed !== 'boolean'
  ) {
    return null;
  }
  return {
    id: value.id,
    title: value.title.trim(),
    url: value.url.trim(),
    printed: value.printed,
  };
}

// Lists added after the first release are optional so older data still loads.
function parseOptionalList<T>(value: unknown, parseItem: (item: unknown) => T | null) {
  return value === undefined ? [] : parseList(value, parseItem);
}

export function validateAppState(value: unknown): StateCheck {
  if (!isRecord(value)) return { ok: false, reason: 'shape' };

  const houses = parseList(value.houses, parseHouse);
  const routines = parseList(value.routines, parseRoutine);
  const oneOffs = parseList(value.oneOffs, parseOneOff);
  const shoppingItems = parseList(value.shoppingItems, parseShoppingItem);
  const tasks = parseOptionalList(value.tasks, parseTask);
  const printItems = parseOptionalList(value.printItems, parsePrintItem);
  if (
    !houses ||
    houses.length === 0 ||
    !routines ||
    !oneOffs ||
    !shoppingItems ||
    !tasks ||
    !printItems
  ) {
    return { ok: false, reason: 'shape' };
  }

  const houseIds = new Set(houses.map((house) => house.id));
  if (!shoppingItems.every((item) => houseIds.has(item.houseId))) {
    return { ok: false, reason: 'references' };
  }
  return {
    ok: true,
    state: { houses, routines, oneOffs, shoppingItems, tasks, printItems },
  };
}

export function parseStoredState(raw: string | null) {
  if (raw === null) return { state: createDefaultState(), wasInvalid: false };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { state: createDefaultState(), wasInvalid: true };
  }
  const check = validateAppState(parsed);
  return check.ok
    ? { state: check.state, wasInvalid: false }
    : { state: createDefaultState(), wasInvalid: true };
}
