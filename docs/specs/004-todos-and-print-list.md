# Spec 004 - Day Tasks and 3D Print List

## Objective

Add two small features to the app: a per-day **task list** (things to do tomorrow or on a given weekday) inside the `Semana` tab, and a **3D print list** (a new `3D` tab) that stores links of models the user wants to print.

## Context

- Single user, Android only, offline-first. All data stays on the device.
- A task is close to a one-off activity but has no time or duration and has a "done" state. Spec 001 says activities have no done state, so tasks are a separate entity and do not change activities.
- The print list is close to the shopping list: a flat list with a toggle ("printed") and a "clear done" action.
- Spec 003 (retention) already defines how long past one-offs are kept. Done tasks reuse that period.
- UI copy is Brazilian Portuguese, sentence case, per `docs/standards/ui-copy-policy.md`.
- Approved layout mockup (private artifact): https://claude.ai/artifact/Kk7GsGVzkKuReSQVEzyeFQ

## Goals

- Create tasks for a specific date, see them in the day view of `Semana`, mark them done and delete them.
- Unfinished tasks from past days move to today by themselves.
- Save print items (title + link), open the link in the browser, mark items as printed and clear the printed ones.
- Both lists are part of the local state, the backup and the reset.

## Non-goals

- No notifications for tasks (no time, so there is no natural moment; may be a future spec).
- No time, duration, priority, notes or repetition on tasks. Repeating work stays in routines.
- No overdue state: unfinished tasks are moved to today instead.
- No notes, tags, categories or filters on print items.
- No link preview, title fetching or any network call by the app. The link is only opened in the external browser.
- No automatic deletion of print items.
- No change to the backup `formatVersion`.
- No navigation library; the 4 tabs stay plain component state.

## Data Model

Two new lists in the single document under `@life-plan-app/state/v1`:

```ts
type Task = { id: string; title: string; date: string; done: boolean };       // date: "YYYY-MM-DD"
type PrintItem = { id: string; title: string; url: string; printed: boolean };

type AppState = {
  // existing: houses, routines, oneOffs, shoppingItems
  tasks: Task[];
  printItems: PrintItem[];
};
```

Rules:

- Titles are trimmed and must be non-empty. Ids come from `ids.ts`.
- `url` is trimmed and must start with `http://` or `https://` and have a host (checked by a pure `isValidUrl`). Anything else is rejected on save and on restore.
- Default and reset state: both lists empty.
- **Compatibility:** `tasks` and `printItems` are optional when reading. A stored state or a backup without them (written before this spec) loads with `[]`. When a list is present but malformed, the whole state is invalid, like the existing lists. The backup keeps `formatVersion: 1`; the hash covers the new lists like the rest of `data`. A backup created by this version and read by an older version is out of scope.
- `createBackupText` and `validateAppState` handle both lists; no other backup rule changes.

## Rollover and Retention

### Rollover

A pure function `rollOverTasks(state, today)` sets `date = today` for every task with `done === false` and `date` before `today`. It returns the **same state object** when nothing changes (no save, no re-render). Done tasks and today or future tasks are untouched.

Rollover runs:

- on app start, once the stored data has loaded (and not after a failed read, like the cleanup in spec 003);
- every time the app returns to the foreground (React Native `AppState` `active` event), so a task is moved when the app stays in the background across midnight.

It does **not** run after a backup restore or a reset; the next start or foreground does it.

### Retention (extends spec 003)

`purgeOldOneOffs` also deletes **done** tasks whose date is before `today - keepDays`, with the same rule and the same `keepDays`. Unfinished tasks never expire (rollover keeps them on today). `countExpiredOneOffs` counts them too, so the `Histórico` confirmation says how many events and tasks would be deleted. The hint in `Histórico` becomes `Eventos avulsos e tarefas feitas mais antigos são apagados automaticamente.` Print items are never affected. Function names stay as they are to avoid renaming churn; the doc comment and `docs/app-context.md` describe the wider meaning.

## UX Behavior

### Tabs

`Semana` (`calendar-outline`), `Compras` (`cart-outline`), `3D` (`cube-outline`), `Manutenção` (`settings-outline`), in this order.

### Semana: tasks of the day

- Below the activity cards of the selected day, a `Tarefas` block with a counter (`1 de 3 feitas`). It is hidden when the day has no tasks.
- Each row: a check circle, the title, a trash icon. Done tasks are struck through and sorted to the end; the rest keep creation order.
- Tapping the circle toggles done. Tapping the title opens the task form to edit. The trash icon asks for confirmation before deleting.
- The day strip shows a small dot under each day that has at least one **pending** task.
- A day with tasks but no activities does not show the empty-day message.
- The floating `+` button opens a bottom sheet `O que você quer adicionar?` with `Evento` (opens the existing activity form, unchanged) and `Tarefa`.

### Task form

- Title field, and a day picker with chips `Hoje`, `Amanhã` and `Escolher data` (reuses the date field of the activity form), plus a hint `Se não for feita até o fim do dia, passa sozinha para hoje.`.
- New tasks start on the selected day of the `Semana` tab.
- `Excluir tarefa` appears only when editing, with confirmation.
- Empty title blocks saving with the same validation style as the activity form.

### Aba 3D

- Top: `Título` and `Link` inputs and an `Adicionar` button. An invalid link shows `Cole um link que comece com http:// ou https://` under the field and nothing is saved.
- List in creation order, printed items struck through and sorted to the end. Each row: check circle (printed), title, the link host (`printables.com`) in small text, an open icon and a trash icon.
- Tapping the title or the open icon opens the link with `Linking.openURL`. If it cannot be opened, a short message replaces the host line for a moment: `Não foi possível abrir o link.`.
- The trash icon deletes immediately, like shopping items. `Limpar impressos` removes all printed items after confirmation.
- Empty state: a friendly message, in the same tone as `Compras`.

### Manutenção

No new section. `Histórico` text changes as described above. `Limpar tudo` and `Restaurar backup` warn as today and now also cover tasks and print items.

## Implementation Notes

- `src/lib/appState.ts`: add the two types, `parseTask`, `parsePrintItem`, optional parsing, defaults.
- `src/lib/tasks.ts` (pure): `addTask`, `updateTask`, `toggleTask`, `deleteTask`, `tasksForDate` (sorted), `hasPendingTask(state, dateKey)`, `rollOverTasks`. Reuses `dates.ts`.
- `src/lib/printItems.ts` (pure): `isValidUrl`, `urlHost`, `addPrintItem`, `togglePrinted`, `deletePrintItem`, `clearPrinted`, `sortPrintItems`.
- `src/lib/retention.ts`: extend the shared filter to done tasks; keep the same-object-when-unchanged contract.
- `useAppState`: actions for tasks and print items through the existing `update`; a `rollOverTasks()` action. `LifePlanApp.tsx` calls it at start (guarded like the cleanup) and on foreground via an effect with a small subscription to `AppState`.
- Components: `components/week/TaskList.tsx` (block), `TaskFormModal.tsx` (uses `ModalShell`), `AddChoiceSheet.tsx`; `DayStrip` gets the pending dot; `components/print/PrintScreen.tsx` and `PrintItemRow.tsx`; `TabBar` receives the new tab from `LifePlanApp.tsx`.
- No new dependency. `Linking` and `AppState` come from `react-native`.
- Reminders (spec 002) are not affected: they read only routines and one-offs.

## Tests

- `appState`: state and backup without the new lists load with `[]`; valid lists round trip; malformed task (bad date, missing `done`) or print item (bad url) is rejected; reset returns empty lists.
- `backup`: round trip with both lists; hash covers them (tampering with a task fails the hash check).
- `tasks`: add (trim, empty title rejected), toggle, delete, `tasksForDate` order (pending first, done last), `hasPendingTask`.
- `rollOverTasks`: pending past task moves to today; done past task stays; today and future untouched; same object when nothing changes; month and year boundary.
- `retention`: done task exactly `keepDays` old kept, one day older deleted; pending old task kept; print items untouched; `countExpiredOneOffs` includes tasks; same object when nothing expires.
- `printItems`: `isValidUrl` (http, https, no scheme, `javascript:`, empty host, spaces), `urlHost`, toggle, delete, `clearPrinted`, sort order.
- Visual components need no tests.

## Acceptance Criteria

- The app has four tabs; the header and greeting still show on every tab.
- In `Semana`, the `+` button offers `Evento` or `Tarefa`; events work exactly as before.
- Tasks appear in their day, can be added, edited, toggled and deleted; the day strip dots mark days with pending tasks.
- An unfinished task from a past day is on today after app start or after the app returns to the foreground; done tasks stay on their day.
- Done tasks older than the retention period are deleted by the cleanup; pending tasks and print items never are; the `Histórico` confirmation counts tasks.
- The `3D` tab adds items with a valid link, rejects invalid links with the message, opens links in the browser, toggles printed, deletes, and clears printed after confirmation.
- Backup and restore include both lists; old backups still restore; `Limpar tudo` empties both.
- `npm run check` passes and `src/lib/` coverage stays above 80%.
- `README.md` and `docs/app-context.md` are updated per their policies.

## Delivery Plans

One spec, planned in tasks executed one at a time (details in the plan):

1. State and backup: types, parsing, defaults, compatibility tests.
2. Tasks logic: `tasks.ts`, `rollOverTasks`, retention extension, tests.
3. Print list logic: `printItems.ts`, tests.
4. Store wiring: `useAppState` actions, rollover at start and on foreground.
5. `Semana` UI: task block, form, add-choice sheet, day strip dots.
6. `3D` tab UI and the new tab in the bar.
7. Docs: `README.md`, `docs/app-context.md`, `Histórico` copy.

## Validation

```bash
npm run check
```

Manual check on the emulator: add tasks for today, tomorrow and a past date (by editing the device date), confirm rollover on foreground; add print items, open a link, restore an old backup.
