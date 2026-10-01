const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];
const WEEKDAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_NAMES = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, '0');

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}

// Sunday-based: week 1 is the week that contains January 1.
export function weekNumber(date: Date) {
  const firstWeekStart = startOfWeek(new Date(date.getFullYear(), 0, 1));
  const days = Math.round(
    (startOfWeek(date).getTime() - firstWeekStart.getTime()) / DAY_MS,
  );
  return Math.floor(days / 7) + 1;
}

export function formatDayTitle(date: Date) {
  return `${WEEKDAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

export function weekdayName(day: number) {
  return WEEKDAY_NAMES[day];
}

export function weekdayLetter(day: number) {
  return WEEKDAY_LETTERS[day];
}
