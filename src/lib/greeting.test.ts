import { greetingForHour, greetingText } from './greeting';

describe('greetingForHour', () => {
  it.each([
    [0, 'Boa noite'],
    [4, 'Boa noite'],
    [5, 'Bom dia'],
    [11, 'Bom dia'],
    [12, 'Boa tarde'],
    [17, 'Boa tarde'],
    [18, 'Boa noite'],
    [23, 'Boa noite'],
  ])('hour %i -> %s', (hour, expected) => {
    expect(greetingForHour(hour)).toBe(expected);
  });
});

describe('greetingText', () => {
  it('appends the smiley to the greeting of the given date', () => {
    expect(greetingText(new Date(2026, 9, 6, 8, 30))).toBe('Bom dia :)');
    expect(greetingText(new Date(2026, 9, 6, 14, 0))).toBe('Boa tarde :)');
    expect(greetingText(new Date(2026, 9, 6, 21, 0))).toBe('Boa noite :)');
  });
});
