import type { ActivityDraft } from './activities';
import type { Activity } from './schedule';

export type FormValues = {
  title: string;
  startHour: string;
  startMinute: string;
  durationHours: string;
  durationMinutes: string;
  repeats: boolean;
  weekdays: number[];
  date: string;
};

type ParseResult = { ok: true; draft: ActivityDraft } | { ok: false; error: string };

const pad = (value: number) => String(value).padStart(2, '0');

export function emptyForm(dateKey: string): FormValues {
  return {
    title: '',
    startHour: '08',
    startMinute: '00',
    durationHours: '1',
    durationMinutes: '0',
    repeats: false,
    weekdays: [],
    date: dateKey,
  };
}

export function formFromActivity(activity: Activity): FormValues {
  const [startHour, startMinute] = activity.startTime.split(':');
  return {
    title: activity.title,
    startHour,
    startMinute,
    durationHours: String(Math.floor(activity.durationMin / 60)),
    durationMinutes: String(activity.durationMin % 60),
    repeats: activity.kind === 'routine',
    weekdays: activity.kind === 'routine' ? activity.weekdays : [],
    date: activity.kind === 'oneoff' ? activity.date : '',
  };
}

// Digits only; a blank field counts as zero when `blankAsZero` is set.
function toNumber(text: string, blankAsZero: boolean) {
  const trimmed = text.trim();
  if (trimmed === '') return blankAsZero ? 0 : Number.NaN;
  return /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

export function parseActivityForm(values: FormValues): ParseResult {
  const title = values.title.trim();
  if (title === '') return { ok: false, error: 'Informe o título.' };

  const hour = toNumber(values.startHour, false);
  const minute = toNumber(values.startMinute, false);
  if (!(hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)) {
    return { ok: false, error: 'Horário inválido.' };
  }

  const durationMin =
    toNumber(values.durationHours, true) * 60 + toNumber(values.durationMinutes, true);
  if (!(durationMin >= 1 && durationMin <= 1440)) {
    return { ok: false, error: 'Duração inválida.' };
  }

  const startTime = `${pad(hour)}:${pad(minute)}`;
  if (!values.repeats) {
    return {
      ok: true,
      draft: { kind: 'oneoff', title, startTime, durationMin, date: values.date },
    };
  }
  if (values.weekdays.length === 0) {
    return { ok: false, error: 'Escolha ao menos um dia da semana.' };
  }
  const weekdays = [...values.weekdays].sort((a, b) => a - b);
  return {
    ok: true,
    draft: { kind: 'routine', title, startTime, durationMin, weekdays },
  };
}
