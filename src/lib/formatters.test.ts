import {
  formatDuration,
  formatTimeRange,
  padTwoDigits,
  timeToMinutes,
} from './formatters';

describe('formatDuration', () => {
  it.each([
    [240, '4h'],
    [60, '1h'],
    [90, '1h30'],
    [45, '45min'],
    [1440, '24h'],
  ])('%i min -> %s', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});

describe('formatTimeRange', () => {
  it('shows start and end', () => {
    expect(formatTimeRange('08:00', 240)).toBe('08:00–12:00');
  });

  it('wraps the end time past midnight', () => {
    expect(formatTimeRange('23:30', 90)).toBe('23:30–01:00');
  });
});

describe('timeToMinutes', () => {
  it('converts HH:mm to minutes', () => {
    expect(timeToMinutes('08:30')).toBe(510);
    expect(timeToMinutes('00:00')).toBe(0);
  });
});

describe('padTwoDigits', () => {
  it('pads a single digit and keeps two digits as typed', () => {
    expect(padTwoDigits('5')).toBe('05');
    expect(padTwoDigits('0')).toBe('00');
    expect(padTwoDigits('12')).toBe('12');
  });

  it('leaves a blank field blank', () => {
    expect(padTwoDigits('')).toBe('');
    expect(padTwoDigits('  ')).toBe('  ');
  });
});
