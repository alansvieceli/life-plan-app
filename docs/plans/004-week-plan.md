# Plan 004 - Weekly Planner (Semana)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** The `Semana` tab: browse weeks, see a day's activities (weekly routines plus one-off activities, sorted by start time, overlaps flagged), and add, edit and delete activities.

**Architecture:** Pure logic in `src/lib/` (`dates`, `formatters`, `schedule`, `activities`, `activityForm`), all unit tested. `useAppState` gains two actions. UI is `WeekScreen` composed of a week header, a day strip, activity cards and an add/edit modal built on a shared `ModalShell`.

**Spec:** `docs/specs/001-life-plan-app.md` (section Semana). Depends on plans 001-003.

## Global Constraints

- Same as plans 001-003: Android only, no new dependencies, TypeScript strict, no `any`, `npm run check` green, `src/lib/` coverage above 80%, duplication at or below 5%, `docs/standards/react-native-standards.md`, pt-BR sentence-case copy, commits `type: message` with the session's `Co-Authored-By` line, merges with `chore:`.
- Week starts on Sunday; 24-hour `HH:mm`; durations stored in minutes (1 to 1440).
- Activities that cross midnight are not handled: an activity belongs to its start day; the end time is shown modulo 24 h; overlap uses start/end minutes on the same day.
- Overlaps never block saving; the card shows an amber `alert-circle-outline`.
- Editing or deleting a routine affects every week; the form says so. An activity keeps its kind (routine or one-off) when edited.
- Time and duration are typed as two numeric fields (hours and minutes); no date/time picker dependency. A one-off's date is changed with previous/next day buttons in the form.

## Review Focus

- Invalid form input (blank title, hour 24, minute 60, zero duration, no weekday selected) shows a readable message and does not save (Task 3 tests).
- A routine and a one-off on the same day interleave by start time; equal start times order by title (Task 2 test).
- Overlap detection treats back-to-back activities (one ends when the next starts) as NOT overlapping (Task 2 test).
- Week navigation across a month and year boundary keeps weekday alignment (Task 1 test).
- Deleting a routine from one day removes it from every week; the confirmation says so (Task 4, manual).
- The modal form is usable with the keyboard open and does not lose typed text when a validation error appears (Task 4, manual).

---

### Task 1: Dates and formatters (TDD)

**Files:** Create `src/lib/dates.ts`, `src/lib/dates.test.ts`, `src/lib/formatters.ts`, `src/lib/formatters.test.ts`.

**Interfaces (produces):**
- `toDateKey(date: Date): string` (`YYYY-MM-DD`, local), `parseDateKey(key: string): Date` (local midnight), `addDays(date, days): Date`, `startOfWeek(date): Date` (Sunday), `weekNumber(date): number` (Sunday-based week of the year, week 1 contains Jan 1), `formatDayTitle(date): string` (`Terça, 6 out`), `weekdayLetter(day: number): string` (`D S T Q Q S S`).
- `formatDuration(min: number): string` (`4h`, `1h`, `1h30`, `45min`), `formatTimeRange(startTime: string, durationMin: number): string` (`08:00–12:00`, en dash, end modulo 24 h), `timeToMinutes(time: string): number`.

- [ ] Write the failing tests: week start for a Wednesday, Sunday and Saturday; `addDays` across month and year end; `toDateKey`/`parseDateKey` round trip; `weekNumber` for Jan 1 and for a mid-year date; `formatDayTitle` for a Tuesday in October; durations 240, 60, 90, 45, 1440; ranges 08:00 + 240, 23:30 + 90 (`23:30–01:00`); `timeToMinutes('08:30')`.
- [ ] Run `npx jest src/lib/dates src/lib/formatters`; expect FAIL (modules missing). Implement; expect PASS.
- [ ] Commit `feat: add date and time helpers`.

### Task 2: Schedule and activity mutations (TDD)

**Files:** Create `src/lib/schedule.ts`, `src/lib/schedule.test.ts`, `src/lib/activities.ts`, `src/lib/activities.test.ts`; modify `src/lib/appState.ts` (export `Routine`, `OneOff` as needed).

**Interfaces (produces):**
- `type Activity = ({ kind: 'routine'; weekdays: number[] } | { kind: 'oneoff'; date: string }) & { id: string; title: string; startTime: string; durationMin: number; overlaps: boolean }`.
- `activitiesForDate(state: AppState, dateKey: string): Activity[]`: routines whose `weekdays` include that date's weekday plus one-offs on that date; sorted by start time then title; `overlaps` true when the half-open intervals `[start, start+duration)` of two activities intersect.
- `type ActivityDraft = { kind: 'routine'; title; startTime; durationMin; weekdays: number[] } | { kind: 'oneoff'; title; startTime; durationMin; date: string }`; `upsertActivity(state, id, draft): AppState` (replace by id in the list of the draft's kind, otherwise append); `removeActivity(state, kind: 'routine' | 'oneoff', id): AppState`.

- [ ] Write the failing tests for every rule above (routine on the right weekdays only, one-off on its date only, interleaving and tie order, overlap true/false/back-to-back, upsert append and replace, remove).
- [ ] Run `npx jest src/lib/schedule src/lib/activities`; expect FAIL, implement, expect PASS.
- [ ] Commit `feat: add schedule and activity rules`.

### Task 3: Activity form parsing (TDD)

**Files:** Create `src/lib/activityForm.ts`, `src/lib/activityForm.test.ts`.

**Interfaces (produces):**
- `type FormValues = { title: string; startHour: string; startMinute: string; durationHours: string; durationMinutes: string; repeats: boolean; weekdays: number[]; date: string }`.
- `emptyForm(dateKey: string): FormValues` (title empty, `08:00`, 1 h, `repeats` false, weekdays `[]`, `date` = dateKey).
- `formFromActivity(activity: Activity): FormValues`.
- `parseActivityForm(values: FormValues): { ok: true; draft: ActivityDraft } | { ok: false; error: string }`. Errors (pt-BR): `Informe o título.`, `Horário inválido.`, `Duração inválida.`, `Escolha ao menos um dia da semana.`. Hours 0-23, minutes 0-59, duration 1 to 1440 minutes, title trimmed.

- [ ] Write the failing tests (valid routine, valid one-off, each error, trimming, `formFromActivity` round trip).
- [ ] Run, implement, pass. Commit `feat: add activity form parsing`.

### Task 4: Week UI

**Files:** Create `src/components/common/ModalShell.tsx`, `src/components/common/NumberPairField.tsx`, `src/components/common/FloatingAddButton.tsx`, `src/components/week/WeekHeader.tsx`, `src/components/week/DayStrip.tsx`, `src/components/week/ActivityCard.tsx`, `src/components/week/ActivityFormModal.tsx`, `src/components/week/WeekScreen.tsx`, `src/theme/activityColors.ts`; modify `src/hooks/useAppState.ts` (`saveActivity(id, draft)`, `deleteActivity(kind, id)`), `src/LifePlanApp.tsx`.

Behavior: as in the spec (Semana). `WeekScreen` keeps the selected date key (default today). The header shows `Semana N`, the day title and previous/next week buttons (shift the selected date by 7 days). The strip shows the 7 days of the selected date's week (letter plus day number), selected day filled with `accent`. Cards show a colored left stripe (`activityColorFor(id)`), title, time range and duration, a `repeat` or `calendar-outline` icon, and the amber overlap icon. A floating `add` button opens the form (new activity, defaults from `emptyForm(selectedKey)`); tapping a card opens it prefilled with `Excluir` available. The form has: title, `Começa às` (hour : minute), `Duração` (h and min), a type switch `Repete toda semana` / `Só neste dia`, a weekday `ChipRow`-style multi-select (letters) or a date row with previous/next day buttons, a note for routines (`Vale para todas as semanas.`), an error line, `Cancelar` and `Salvar`.

- [ ] Add the hook actions and the components; wire `WeekScreen` into the `week` tab.
- [ ] Run `npm run fix && npm run check && npm run dup`; expect green and 0 clones. Run `npx expo export --platform android`; expect bundle OK.
- [ ] Manual emulator check (left to the user when no emulator is available): add a routine and a one-off, edit both, delete both, overlap marker, week navigation, keyboard open in the form.
- [ ] Commit `feat: add weekly planner tab`.

### Task 5: Documentation and merge

- [ ] Update `README.md` (Semana implemented; remove the Planned section), `docs/app-context.md` (Status, planner concepts) and the coverage and duplication baselines.
- [ ] Run `npm run check` and `npm run dup`; expect green.
- [ ] Commit `docs: document weekly planner`, then merge into `master` with a `chore: merge ...` commit.
