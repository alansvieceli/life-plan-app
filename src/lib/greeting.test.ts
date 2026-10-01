import { greetingText } from './greeting';

describe('greetingText', () => {
  it.each([
    [0, 'Boa noite :)'],
    [4, 'Boa noite :)'],
    [5, 'Bom dia :)'],
    [11, 'Bom dia :)'],
    [12, 'Boa tarde :)'],
    [17, 'Boa tarde :)'],
    [18, 'Boa noite :)'],
    [23, 'Boa noite :)'],
  ])('hour %i -> %s', (hour, expected) => {
    expect(greetingText(new Date(2026, 9, 6, hour, 30))).toBe(expected);
  });

  it('uses the current time when no date is given', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 6, 8, 0));
    expect(greetingText()).toBe('Bom dia :)');
    jest.useRealTimers();
  });
});
