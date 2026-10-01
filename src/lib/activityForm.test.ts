import { emptyForm, formFromActivity, parseActivityForm } from './activityForm';
import type { Activity } from './schedule';

const valid = () => ({ ...emptyForm('2026-10-06'), title: '  Ler  ' });

describe('emptyForm', () => {
  it('starts at 08:00 for 1 hour on the given date', () => {
    expect(emptyForm('2026-10-06')).toEqual({
      title: '',
      startHour: '08',
      startMinute: '00',
      durationHours: '1',
      durationMinutes: '0',
      repeats: false,
      weekdays: [],
      date: '2026-10-06',
    });
  });
});

describe('parseActivityForm', () => {
  it('builds a one-off draft with a trimmed title', () => {
    expect(parseActivityForm(valid())).toEqual({
      ok: true,
      draft: {
        kind: 'oneoff',
        title: 'Ler',
        startTime: '08:00',
        durationMin: 60,
        date: '2026-10-06',
      },
    });
  });

  it('builds a routine draft with sorted weekdays', () => {
    const values = { ...valid(), repeats: true, weekdays: [5, 1, 3] };
    expect(parseActivityForm(values)).toEqual({
      ok: true,
      draft: {
        kind: 'routine',
        title: 'Ler',
        startTime: '08:00',
        durationMin: 60,
        weekdays: [1, 3, 5],
      },
    });
  });

  it('pads single-digit hours and minutes', () => {
    const values = { ...valid(), startHour: '7', startMinute: '5' };
    const result = parseActivityForm(values);
    expect(result.ok && result.draft.startTime).toBe('07:05');
  });

  it.each([
    ['blank title', { title: '   ' }, 'Informe o título.'],
    ['hour 24', { startHour: '24' }, 'Horário inválido.'],
    ['minute 60', { startMinute: '60' }, 'Horário inválido.'],
    ['empty hour', { startHour: '' }, 'Horário inválido.'],
    ['non numeric hour', { startHour: 'ab' }, 'Horário inválido.'],
    [
      'zero duration',
      { durationHours: '0', durationMinutes: '0' },
      'Duração inválida.',
    ],
    [
      'duration over a day',
      { durationHours: '24', durationMinutes: '1' },
      'Duração inválida.',
    ],
    ['empty duration', { durationHours: '', durationMinutes: '' }, 'Duração inválida.'],
    ['negative minutes', { durationMinutes: '-5' }, 'Duração inválida.'],
    [
      'routine without weekdays',
      { repeats: true, weekdays: [] },
      'Escolha ao menos um dia da semana.',
    ],
  ])('rejects %s', (_name, change, error) => {
    expect(parseActivityForm({ ...valid(), ...change })).toEqual({ ok: false, error });
  });

  it('treats an empty duration field as zero when the other field is set', () => {
    const result = parseActivityForm({
      ...valid(),
      durationHours: '',
      durationMinutes: '45',
    });
    expect(result.ok && result.draft.durationMin).toBe(45);
  });
});

describe('formFromActivity', () => {
  const base = {
    id: 'a1',
    title: 'Trabalhar',
    startTime: '08:30',
    durationMin: 270,
    overlaps: false,
  };

  it('fills a routine form', () => {
    const activity: Activity = { ...base, kind: 'routine', weekdays: [1, 2] };
    expect(formFromActivity(activity)).toMatchObject({
      title: 'Trabalhar',
      startHour: '08',
      startMinute: '30',
      durationHours: '4',
      durationMinutes: '30',
      repeats: true,
      weekdays: [1, 2],
    });
  });

  it('fills a one-off form and round trips through the parser', () => {
    const activity: Activity = { ...base, kind: 'oneoff', date: '2026-10-09' };
    const form = formFromActivity(activity);
    expect(form.repeats).toBe(false);
    expect(form.date).toBe('2026-10-09');
    expect(parseActivityForm(form)).toEqual({
      ok: true,
      draft: {
        kind: 'oneoff',
        title: 'Trabalhar',
        startTime: '08:30',
        durationMin: 270,
        date: '2026-10-09',
      },
    });
  });
});
