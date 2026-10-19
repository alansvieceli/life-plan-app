# Plan 007 - Day Tasks and 3D Print List

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add a per-day task list to `Semana` (with automatic rollover of unfinished tasks to today) and a `3D` tab with a print list of links.

**Architecture:** Two new lists (`tasks`, `printItems`) in the existing `AppState` document, optional when reading so old state and old backups still load. Pure rules in `src/lib/tasks.ts` and `src/lib/printItems.ts`; retention extended in `src/lib/retention.ts`. `useAppState` exposes actions through the existing `update`. Rollover runs at start and on foreground from `LifePlanApp`. UI follows the existing `Semana` and `Compras` components.

**Tech Stack:** Expo SDK 56, React Native 0.85, TypeScript strict, Jest (`jest-expo`), Biome, Knip. No new dependencies (`Linking` and `AppState` come from `react-native`).

**Spec:** `docs/specs/004-todos-and-print-list.md`. Builds on spec 003 / plan 006 (retention) already in the code.

## Global Constraints

- Android only; no backend; all data on the device; no new dependencies.
- TypeScript strict, no `any`; Biome single quotes, 2 spaces, line width 88; `npm run check` green; `src/lib/` coverage above 80%; duplication at or below 5% (`npm run dup`).
- Standards: `docs/standards/react-native-standards.md`, `docs/standards/ui-copy-policy.md` (pt-BR, sentence case), `docs/standards/code-duplication-policy.md`, `docs/standards/testing-policy.md`.
- State key `@life-plan-app/state/v1` unchanged; backup `formatVersion` stays `1`; `tasks` and `printItems` optional when reading (missing → `[]`), malformed when present → invalid state.
- `Task = { id; title; date: "YYYY-MM-DD"; done }`, `PrintItem = { id; title; url; printed }`. Titles trimmed and non-empty; ids from `createId`; URL valid only if it starts with `http://` or `https://` and has a host.
- Tabs in order: `Semana` (`calendar-outline`), `Compras` (`cart-outline`), `3D` (`cube-outline`), `Manutenção` (`settings-outline`).
- Function names `purgeOldOneOffs` / `countExpiredOneOffs` do not change.
- Commits `type: message`, ending with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Branch: `feat/todos-and-print-list` from `main` (assumes the retention branch is merged first; if not, branch from it and say so in the final summary).

## Review Focus

- A stored state or backup written before this spec (no `tasks`/`printItems`) loads with `[]` (Task 1 tests).
- `javascript:`, `ftp://`, `http://` with empty host, and URLs with spaces are rejected on save and on restore (Tasks 1 and 3 tests).
- Rollover returns the same object when nothing moves, so no save and no re-render happen (Task 2 test); month and year boundary (Task 2 test).
- Rollover on foreground must act on the latest state, not a stale closure from when the listener was registered (Task 4: the callback is kept in a ref).
- Rollover never runs after a failed read of stored data (Task 4: guarded by `loadFailed`, like the retention cleanup).
- Editing a task's date into the past leaves it there until the next start/foreground, then it moves to today (Task 5, manual).
- A day with only tasks does not show `Nada planejado para este dia.` (Task 5, manual).

---

### Task 1: State, backup and URL rule (TDD)

**Files:** Modify `src/lib/appState.ts`, `src/lib/stateFixtures.ts`, `src/lib/appState.test.ts`, `src/lib/backup.test.ts`. Create `src/lib/printItems.ts`, `src/lib/printItems.test.ts`.

`appState.ts` needs `isValidUrl`, so the URL rule lands here; the rest of `printItems.ts` comes in Task 3. `printItems.ts` imports from `appState.ts` with `import type` only, so there is no runtime cycle.

**Interfaces (produces):**
- `appState.ts`: `export type Task`, `export type PrintItem`, `AppState` gains `tasks: Task[]; printItems: PrintItem[]`; `createDefaultState()` returns both as `[]`.
- `printItems.ts`: `isValidUrl(value: string): boolean` (trims first), `urlHost(url: string): string`.

- [ ] **Step 1: Tests first.**
  - `printItems.test.ts`, `isValidUrl`: true for `https://www.printables.com/model/1`, `http://a.co`, `  https://a.co  ` (trimmed); false for `printables.com`, `javascript:alert(1)`, `ftp://a.co`, `https://`, `https:///path`, `https://a b.co`, `''`. `urlHost`: `https://www.printables.com/model/1?x=1` → `printables.com`; `http://localhost:8080/a` → `localhost:8080`.
  - `appState.test.ts`: a state object without `tasks`/`printItems` validates `ok` with both `[]`; valid lists round trip through `validateAppState`; rejected (`reason: 'shape'`): task with date `2026-02-30`, task without `done`, task with empty title, print item with `url: 'javascript:alert(1)'`, `tasks` not an array; `createDefaultState()` has both lists empty; `parseStoredState` of an old JSON string (no new lists) returns `wasInvalid: false`.
  - `backup.test.ts`: round trip of `createSampleState()` (now with one task and one print item) restores equal; a backup whose `data` has no new lists (build it with the same helper used by existing tests, hash recomputed) restores with `[]`; changing a task title inside the backup text fails with the `tampered` error.
- [ ] **Step 2:** `npx jest src/lib`; expect FAIL.
- [ ] **Step 3: Implement.**
  - `isValidUrl`: regex `/^https?:\/\/[^\s/?#]+(\/\S*|\?\S*|#\S*)?$/i` on the trimmed value (do not use `URL`: React Native's polyfill is incomplete). Mark with a `// ` comment explaining why.
  - `urlHost`: remove scheme, cut at first `/`, `?` or `#`, keep text after the last `@`, drop a leading `www.`.
  - `parseTask` (id/title via `isText`, `isDate(date)`, `typeof done === 'boolean'`, title trimmed) and `parsePrintItem` (`isValidUrl(url)`, `typeof printed === 'boolean'`, url stored trimmed) in `appState.ts`, same style as `parseShoppingItem`.
  - `validateAppState`: `const tasks = value.tasks === undefined ? [] : parseList(value.tasks, parseTask)` (same for `printItems`); a `null` result is `shape`. Return both lists in the state.
  - `createSampleState()`: add `tasks: [{ id: 'task-1', title: 'Ligar para o banco', date: '2026-10-06', done: false }]` and `printItems: [{ id: 'print-1', title: 'Suporte de fone', url: 'https://www.printables.com/model/1', printed: false }]`.
  - Fix any other `AppState` literal that stops compiling (run `npx tsc --noEmit`).
- [ ] **Step 4:** `npx jest src/lib`; expect PASS. `npx tsc --noEmit` clean.
- [ ] **Step 5:** `npm run fix`; commit `feat: add tasks and print items to app state`.

### Task 2: Tasks logic and retention (TDD)

**Files:** Create `src/lib/tasks.ts`, `src/lib/tasks.test.ts`. Modify `src/lib/retention.ts`, `src/lib/retention.test.ts`.

**Interfaces (consumes):** `Task`, `AppState`; `addDays`, `toDateKey` from `dates.ts`.
**Interfaces (produces)** in `tasks.ts`:
- `addTask(state: AppState, id: string, title: string, date: string): AppState` (trims; empty title returns `state`)
- `updateTask(state: AppState, id: string, title: string, date: string): AppState` (same validation)
- `toggleTask(state: AppState, id: string): AppState`
- `deleteTask(state: AppState, id: string): AppState`
- `tasksForDate(state: AppState, dateKey: string): Task[]` (pending first in creation order, then done)
- `hasPendingTask(state: AppState, dateKey: string): boolean`
- `rollOverTasks(state: AppState, today: Date): AppState` (same object when nothing moves)

- [ ] **Step 1: Tests first.**
  - `tasks.test.ts`: `addTask` trims and appends with `done: false`, whitespace title returns the same object; `updateTask` changes title and date, empty title returns same object; `toggleTask` flips twice back to original; `deleteTask` removes only that id; `tasksForDate` with `[done A, pending B, pending C]` on one day plus a task on another day returns `[B, C, A]`; `hasPendingTask` false when the day only has done tasks.
  - `rollOverTasks` with `today = new Date(2026, 9, 20)`: pending `2026-10-19` → `2026-10-20`; done `2026-10-19` unchanged; pending `2026-10-20` and `2026-10-25` unchanged; returns `toBe(state)` when nothing moves and on an empty list; `new Date(2026, 0, 1)` moves pending `2025-12-31` to `2026-01-01`; other lists keep their references.
  - `retention.test.ts` (extend; the fixture helper also sets `tasks`): done task dated exactly `keepDays` ago kept, one day older deleted; pending old task kept; `printItems` keep their reference; `countExpiredOneOffs` counts expired one-offs plus expired done tasks and equals what `purgeOldOneOffs` removes; `toBe(state)` when nothing expires in either list.
- [ ] **Step 2:** `npx jest src/lib/tasks src/lib/retention`; expect FAIL.
- [ ] **Step 3: Implement** `tasks.ts` following `shopping.ts` style. `rollOverTasks` compares date keys as strings (`task.date < toDateKey(today)`), same trick as `retention.ts`. In `retention.ts` split the shared filter in two (`keptOneOffs`, `keptTasks`; a task is kept when `!task.done || task.date >= cutoff`); `purgeOldOneOffs` returns `state` only when both lengths are unchanged; `countExpiredOneOffs` sums both. Update the doc comment to say it also covers done tasks.
- [ ] **Step 4:** `npx jest src/lib`; expect PASS.
- [ ] **Step 5:** `npm run fix`; commit `feat: add task rules, rollover and task retention`.

### Task 3: Print list logic (TDD)

**Files:** Modify `src/lib/printItems.ts`, `src/lib/printItems.test.ts`.

**Interfaces (produces)** in `printItems.ts`:
- `addPrintItem(state: AppState, id: string, title: string, url: string): AppState` (trims; empty title or invalid URL returns `state`)
- `togglePrinted(state: AppState, id: string): AppState`
- `deletePrintItem(state: AppState, id: string): AppState`
- `clearPrinted(state: AppState): AppState`
- `sortPrintItems(items: PrintItem[]): PrintItem[]` (pending first, then printed, creation order kept)

- [ ] **Step 1: Tests first.** `addPrintItem` trims title and url and appends `printed: false`; whitespace title and `javascript:alert(1)` each return the same object; `togglePrinted` flips; `deletePrintItem` removes only that id; `clearPrinted` removes only printed; `sortPrintItems([printed A, pending B, pending C])` → `[B, C, A]` and does not mutate its input.
- [ ] **Step 2:** `npx jest src/lib/printItems`; expect FAIL on the new functions.
- [ ] **Step 3: Implement**, same style as `shopping.ts`.
- [ ] **Step 4:** `npx jest src/lib`; expect PASS. Run `npm run test:coverage`; `src/lib/` stays above 80%.
- [ ] **Step 5:** `npm run fix`; commit `feat: add print list rules`.

### Task 4: Store wiring and rollover triggers

**Files:** Modify `src/hooks/useAppState.ts`, `src/LifePlanApp.tsx`. Create `src/hooks/useOnForeground.ts`.

**Interfaces (consumes):** Tasks 2 and 3 functions; `createId` (prefixes `'task'` and `'print'`).
**Interfaces (produces):**
- `useAppState` adds: `addTask(title: string, date: string): void`, `updateTask(id: string, title: string, date: string): void`, `toggleTask(id: string): void`, `deleteTask(id: string): void`, `rollOverTasks(): void`, `addPrintItem(title: string, url: string): void`, `togglePrintItem(id: string): void`, `deletePrintItem(id: string): void`, `clearPrintedItems(): void`.
- `useOnForeground(callback: () => void): void`.

- [ ] **Step 1: Actions** in `useAppState` through `update`. `rollOverTasks` follows the `purgeOldOneOffs` action: `const next = rollOver(state, new Date()); if (next !== state) update(next);` (import with an alias to avoid clashing with the action name).
- [ ] **Step 2: `useOnForeground`**: import `AppState as NativeAppState` from `react-native` (our own type is also called `AppState`). Keep the latest callback in a ref assigned on every render; one `useEffect` with `[]` subscribes via `NativeAppState.addEventListener('change', status => { if (status === 'active') ref.current(); })` and returns `subscription.remove`.
- [ ] **Step 3: `LifePlanApp`**:
  - Start: a second `useRef` guard like `hasPurged`; effect runs `store.rollOverTasks()` once when `store.isLoaded && !store.loadFailed`.
  - Foreground: `useOnForeground(() => { if (store.isLoaded && !store.loadFailed) store.rollOverTasks(); })`.
  - The new tab is added in Task 6, together with `PrintScreen`; this task only wires rollover.
- [ ] **Step 4:** `npx tsc --noEmit`, `npm run check`; expect green. Unused-export warnings from Knip for the new actions are resolved by Tasks 5 and 6, so run Knip fully at the end of Task 6.
- [ ] **Step 5:** commit `feat: wire tasks and print items into the store`.

### Task 5: Semana UI

**Files:** Create `src/components/common/DateField.tsx`, `src/components/week/TaskList.tsx`, `src/components/week/TaskFormModal.tsx`, `src/components/week/AddChoiceSheet.tsx`. Modify `src/components/week/ActivityFormModal.tsx`, `src/components/week/DayStrip.tsx`, `src/components/week/WeekScreen.tsx`, `src/components/maintenance/RetentionSection.tsx`, `src/components/maintenance/MaintenanceScreen.tsx`.

**Interfaces (produces):**
- `DateField({ dateKey: string; onChange: (dateKey: string) => void })`: the previous/next-day row moved out of `ActivityFormModal` (copy it exactly, then make `ActivityFormModal` use it; this avoids a duplicated block).
- `TaskList({ tasks: Task[]; onToggle: (id: string) => void; onEdit: (task: Task) => void; onDelete: (id: string) => void })`: header `Tarefas` + counter `${done} de ${total} feitas`; row = check circle (like `ShoppingItemRow`), title (struck through when done, press opens edit), trash icon asking `confirmAction('Excluir tarefa', 'Excluir esta tarefa?', 'Excluir')`. Returns `null` for an empty list.
- `TaskFormModal({ initialDate: string; editing: Task | null; onSave: (title: string, date: string) => void; onDelete: () => void; onClose: () => void })`: uses `ModalShell` titled `Nova tarefa` / `Editar tarefa`; `Título` input; `ChipRow` with `Hoje`, `Amanhã`, `Escolher data` (the chip is selected when the date is neither today nor tomorrow, or when the user tapped it; then `DateField` shows); hint `Se não for feita até o fim do dia, passa sozinha para hoje.`; empty title shows `Informe o título.` and does not save; `Excluir tarefa` (danger button, only when editing, with confirmation).
- `AddChoiceSheet({ onEvent: () => void; onTask: () => void; onClose: () => void })`: `ModalShell` titled `O que você quer adicionar?` with two `ActionButton`s, `Evento` and `Tarefa`.
- `DayStrip` gets prop `hasPending: (dateKey: string) => boolean` and renders a small dot (`colors.accent`) under the number when true.

- [ ] **Step 1:** Extract `DateField`, switch `ActivityFormModal` to it, run the app bundle check (`npx expo export --platform android`); behavior unchanged.
- [ ] **Step 2:** Build `TaskList`, `TaskFormModal`, `AddChoiceSheet`, reusing `ModalShell`, `ChipRow`, `ActionButton`, `IconButton`, `confirmAction`. No tests (visual).
- [ ] **Step 3: `WeekScreen`**: `tasksForDate(store.state, selectedKey)` rendered by `TaskList` below the activity cards; show `Nada planejado para este dia.` only when there are no activities **and** no tasks; `FloatingAddButton` (label `Adicionar`) opens `AddChoiceSheet`; `Evento` opens the existing activity form unchanged, `Tarefa` opens `TaskFormModal` with `initialDate = selectedKey`; save calls `store.addTask` or `store.updateTask`; pass `hasPending={(key) => hasPendingTask(store.state, key)}` to `DayStrip`.
- [ ] **Step 4: Histórico copy**: `RetentionSection` note becomes `Eventos avulsos e tarefas feitas mais antigos são apagados automaticamente.`; `handleKeepDays` confirmation becomes `Apagar ${expired} item(ns) (eventos avulsos e tarefas feitas) mais antigo(s) que ${keepDays} dias?` (one combined count, assumption recorded here).
- [ ] **Step 5:** `npm run fix && npm run check && npm run dup`; expect green, no new clones. Commit `feat: add day tasks to the week screen`.

### Task 6: 3D tab

**Files:** Create `src/components/print/PrintScreen.tsx`, `src/components/print/PrintItemRow.tsx`. Modify `src/LifePlanApp.tsx`.

**Interfaces (produces):**
- `PrintItemRow({ item: PrintItem; onToggle: () => void; onOpen: () => void; onDelete: () => void; linkError: boolean })`: same row shape as `ShoppingItemRow`; under the title the `urlHost(item.url)` in small text, replaced by `Não foi possível abrir o link.` while `linkError` is true; open icon (`open-outline`) and trash icon. Tapping the title or the open icon calls `onOpen`.
- `PrintScreen({ store: AppStore })`.

- [ ] **Step 1: `PrintScreen`**: inputs `Título` and `Link` plus an `Adicionar` button; on submit, an empty title does nothing, an invalid `isValidUrl(link)` shows `Cole um link que comece com http:// ou https://` under the field and saves nothing, otherwise `store.addPrintItem` and clear both fields. List from `sortPrintItems(store.state.printItems)`. `onOpen`: `Linking.openURL(item.url)` in a `try/catch` (it rejects when no app can handle it); on failure set the failing id in state and clear it with a `setTimeout` of 2500 ms, cleared on unmount. `Limpar impressos` (`ActionButton`, shown only when something is printed) asks `confirmAction('Limpar impressos', 'Remover da lista todos os itens impressos?', 'Limpar')`. Empty state: `Nenhum modelo na lista. Cole um link para começar.` Trash deletes immediately.
- [ ] **Step 2: `LifePlanApp`**: `type AppTab = 'week' | 'shopping' | 'print' | 'maintenance'`; add `{ id: 'print', icon: 'cube-outline', label: '3D' }` between `Compras` and `Manutenção`; render `{activeTab === 'print' ? <PrintScreen store={store} /> : null}`.
- [ ] **Step 3:** `npm run fix && npm run check && npm run dup`, then Knip is part of `check`; expect green with no unused exports. `npx expo export --platform android`; expect bundle OK.
- [ ] **Step 4:** commit `feat: add 3D print list tab`.

### Task 7: Manual check, documentation and finish

- [ ] **Manual check** (left to the user when no device is available): add tasks for today, tomorrow and via `Escolher data`; toggle, edit and delete them; confirm the strip dot appears only for days with pending tasks and a day with only tasks shows no empty message; set the device date forward, background and reopen the app, confirm the pending task moved to today and the done one stayed; set `Histórico` to `7 dias` with a done task older than 7 days and confirm the prompt counts it; add print items with a valid and an invalid link, open a link, mark printed, `Limpar impressos`; create a backup, `Limpar tudo`, restore, confirm both lists return; restore a backup made before this feature and confirm it loads.
- [ ] Update `README.md` (tasks and 3D list implemented, four tabs) and `docs/app-context.md` (Status, `Task` and `PrintItem` concepts, rollover rule at start and foreground, retention covering done tasks, print items never deleted, backup compatibility), following `docs/standards/readme-policy.md` and `docs/standards/app-context-policy.md`. Update `docs/quality/coverage-baseline.md` if it records numbers.
- [ ] Run `npm run check` and `npm run dup`; expect green (`docs/standards/spec-completion-policy.md`).
- [ ] Commit `docs: document day tasks and 3D print list`, then merge into `main` with `chore: merge todos and print list` when the user approves.
- [ ] Final summary: files changed, validation executed, pending items.
