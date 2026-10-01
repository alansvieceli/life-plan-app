import {
  addDays,
  formatDayTitle,
  parseDateKey,
  startOfWeek,
  toDateKey,
  weekdayLetter,
  weekNumber,
} from './dates';

describe('toDateKey / parseDateKey', () => {
  it('round trips a local date', () => {
    const date = new Date(2026, 9, 6, 18, 30);
    expect(toDateKey(date)).toBe('2026-10-06');
    expect(toDateKey(parseDateKey('2026-10-06'))).toBe('2026-10-06');
  });

  it('pads month and day', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('addDays', () => {
  it('crosses a month end', () => {
    expect(toDateKey(addDays(new Date(2026, 9, 30), 3))).toBe('2026-11-02');
  });

  it('crosses a year end, forwards and backwards', () => {
    expect(toDateKey(addDays(new Date(2026, 11, 30), 3))).toBe('2027-01-02');
    expect(toDateKey(addDays(new Date(2027, 0, 2), -3))).toBe('2026-12-30');
  });
});

describe('startOfWeek', () => {
  it.each([
    ['2026-10-06', '2026-10-04'], // Tuesday
    ['2026-10-04', '2026-10-04'], // Sunday
    ['2026-10-10', '2026-10-04'], // Saturday
    ['2027-01-01', '2026-12-27'], // across the year boundary
  ])('%s -> %s', (input, expected) => {
    expect(toDateKey(startOfWeek(parseDateKey(input)))).toBe(expected);
  });
});

describe('weekNumber', () => {
  it('is 1 for the week containing January 1', () => {
    expect(weekNumber(parseDateKey('2026-01-01'))).toBe(1);
    expect(weekNumber(parseDateKey('2026-01-03'))).toBe(1);
  });

  it('increments on Sundays', () => {
    expect(weekNumber(parseDateKey('2026-01-04'))).toBe(2);
    expect(weekNumber(parseDateKey('2026-10-06'))).toBe(41);
  });
});

describe('formatDayTitle', () => {
  it('writes weekday, day and short month in Portuguese', () => {
    expect(formatDayTitle(parseDateKey('2026-10-06'))).toBe('Terça, 6 out');
    expect(formatDayTitle(parseDateKey('2026-03-01'))).toBe('Domingo, 1 mar');
  });
});

describe('weekdayLetter', () => {
  it('returns D S T Q Q S S', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(weekdayLetter).join('')).toBe('DSTQQSS');
  });
});
