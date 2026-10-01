# Plan 003 - Shopping List (Compras)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** The `Compras` tab: add items to a house, filter by house, mark bought, delete, and clear bought items.

**Architecture:** Pure shopping rules in `src/lib/shopping.ts` (tested). `useAppState` exposes four new actions. UI is `ShoppingScreen` composed of a reusable `ChipRow` (also useful for the weekday picker in plan 004), an add row and an item row.

**Spec:** `docs/specs/001-life-plan-app.md` (section Compras). Depends on plans 001 and 002.

## Global Constraints

- Same constraints as plans 001/002: Android only, no new dependencies, TypeScript strict, no `any`, Biome/Knip clean (`npm run check`), `src/lib/` coverage above 80%, duplication at or below 5%.
- Follow `docs/standards/react-native-standards.md`: reuse `components/common/`, theme tokens, 44 dp targets, `accessibilityLabel` on icon-only buttons, no business logic in components.
- UI copy in Brazilian Portuguese, sentence case. Item = name + house only (no quantity, no category).
- Bought items stay in the list (struck through, sorted to the end of their group); `Limpar comprados` removes them after confirmation.
- Commits: `type: message` (Husky), with the session's `Co-Authored-By` line.

## Review Focus

- Blank or whitespace-only item names are ignored (Task 1 test).
- An item for a house that does not exist is ignored (Task 1 test).
- The selected filter points to a house that was deleted in `Manutenção`: the screen falls back to `Todas` instead of showing an empty list forever (Task 2, derived value; manual check).
- After clearing bought items, the remaining order is unchanged (Task 1 test).
- Many items: the list scrolls and the add row stays reachable with the keyboard open (Task 2, manual).

---

### Task 1: Shopping rules (TDD)

**Files:** Create `src/lib/shopping.ts`, `src/lib/shopping.test.ts`; modify `src/lib/appState.ts` (export `ShoppingItem`).

**Interfaces:**
- Produces: `addItem(state, id, name, houseId): AppState`, `toggleBought(state, id): AppState`, `deleteItem(state, id): AppState`, `clearBought(state): AppState`, `type HouseGroup = { house: House; items: ShoppingItem[] }`, `groupByHouse(state, filter: string): HouseGroup[]` where `filter` is `'all'` or a house id.

Rules:
- `addItem` trims the name; returns the same `state` object when the name is blank or `houseId` is not a house.
- `groupByHouse`: houses keep their list order; inside a group unbought items come first, bought last, original order kept within each part; with `'all'` houses with no items are omitted; with a house id only that house is returned (even if empty); an unknown id behaves as `'all'`.

- [ ] **Step 1:** Write `shopping.test.ts` covering: add trims and appends unbought; add ignores blank; add ignores unknown house; toggle flips only the target; delete removes only the target; clearBought removes bought and keeps order of the rest; groupByHouse `'all'` omits empty houses and orders unbought before bought; groupByHouse with a house id returns just that house and keeps it when empty; unknown filter behaves as `'all'`.
- [ ] **Step 2:** Run `npx jest src/lib/shopping.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3:** Implement `shopping.ts` and export the `ShoppingItem` type from `appState.ts`.
- [ ] **Step 4:** Run `npx jest src/lib` then `npm run fix`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add shopping list rules`.

---

### Task 2: Store actions and Compras screen

**Files:** Create `src/components/common/ChipRow.tsx`, `src/components/shopping/AddItemRow.tsx`, `src/components/shopping/ShoppingItemRow.tsx`, `src/components/shopping/ShoppingScreen.tsx`; modify `src/hooks/useAppState.ts`, `src/LifePlanApp.tsx`.

**Interfaces:**
- Consumes: `addItem`, `toggleBought`, `deleteItem`, `clearBought`, `groupByHouse`, `createId`, `confirmAction`, `IconButton`, `ActionButton`, `SectionCard` is not used here.
- Produces in `useAppState`: `addShoppingItem(name: string, houseId: string)`, `toggleShoppingItem(id: string)`, `deleteShoppingItem(id: string)`, `clearBoughtItems()`.
- Produces: `ChipRow<T extends string>({ options: { id: T; label: string }[]; selectedId: T; onSelect: (id: T) => void })`, a horizontally scrollable row of pill chips (selected = `accent` fill, `accessibilityState.selected`, min height 44 dp).
- Produces: `ShoppingScreen({ store }: { store: AppStore })`.

Behavior:
- Filter chips: `Todas` plus one per house. A stored filter that no longer matches a house is treated as `Todas` (derived at render, not via effect).
- Add row: name input and an add button (`accessibilityLabel` `Adicionar item`). When the filter is `Todas`, a second `ChipRow` picks the house of the new item (defaults to the first house); when a house is filtered, new items go to that house. Submitting with the keyboard works; the input clears after adding.
- Items grouped under a serif house title when filter is `Todas`; tapping an item toggles bought (check icon `checkmark-circle` / `ellipse-outline`, struck-through text); trash icon deletes (`accessibilityLabel` `Excluir <nome>`).
- `Limpar comprados` (ActionButton, `trash-bin-outline`) is shown only when something is bought and asks for confirmation.
- Empty state text: `Nenhum item na lista.`

- [ ] **Step 1:** Add the four actions to `useAppState.ts` (each calls `update` with the shopping rule; `addShoppingItem` uses `createId('item')`).
- [ ] **Step 2:** Create the components and wire `ShoppingScreen` into the `shopping` tab of `LifePlanApp.tsx` (replace the placeholder for that tab).
- [ ] **Step 3:** Run `npm run fix && npm run check && npm run dup`. Expected: green, 0 clones.
- [ ] **Step 4:** Run `npx expo export --platform android`. Expected: bundles.
- [ ] **Step 5:** Manual emulator check (left to the user if no emulator is available): add items to different houses, filter, toggle, delete, clear bought, delete a filtered house in `Manutenção` and return to `Compras`, keyboard open with many items.
- [ ] **Step 6:** Commit `feat: add shopping list tab`.

---

### Task 3: Documentation and merge

- [ ] **Step 1:** Update `README.md` (Compras implemented; Planned list keeps only Semana) and `docs/app-context.md` (Status and Data: bought items remain until cleared). Record the new coverage and duplication baselines.
- [ ] **Step 2:** Run `npm run check` and `npm run dup`. Expected: green.
- [ ] **Step 3:** Commit `docs: document shopping list`, then merge the branch into `master` with a `chore: merge ...` commit (the Husky hook rejects other types).
