# React, React Native and Expo Standards

Practical rules for this app. Keep code simple; apply a rule when it removes real duplication or risk, not as ceremony. Duplication limits live in `code-duplication-policy.md`.

## Structure

- `src/lib/`: pure TypeScript logic (no React, no React Native imports). All business rules live here and are unit tested.
- `src/hooks/`: state and side effects. `useAppState` is the only code that reads or writes AsyncStorage.
- `src/components/common/`: reusable, feature-agnostic components (buttons, modal shell, fields, tab bar, header).
- `src/components/<feature>/`: components specific to one feature (`week`, `shopping`, `maintenance`).
- `src/theme/`: colors, typography, shared styles. Nothing else defines visual constants.
- Screens and components never import AsyncStorage, file-system, or sharing APIs directly; they receive data and callbacks.

## Components

- One responsibility per component. If a file passes about 200 lines or mixes layout, data rules and effects, split it.
- Reuse first: before writing UI, check `components/common/` and `theme/`. Extract on the second repetition of a structure (list row, form field, modal with actions, section card), not the third.
- Prefer composition (`children`, small slots) over many boolean props. A component with more than about 6 props is a signal to split it.
- Props are explicitly typed with a named `type` (`type TabBarProps = ...`). Use generics for reusable containers (`TabBar<T extends string>`).
- Function components only. Named exports only (default export is allowed just for `App.tsx`).
- Components are presentational where possible: derive display values with `src/lib/` functions, do not compute business rules inside JSX.
- Keys on lists come from stable ids, never array indexes.

## Hooks and state

- Keep state as low as possible and derive the rest during render; do not copy props or state into more state.
- Use `useEffect` only for real side effects (loading, subscriptions). Never to derive state or to react to a click.
- Memoization (`useMemo`, `useCallback`, `React.memo`) only for a measured problem or when a stable reference is required.
- State changes go through the actions exposed by `useAppState`; every action validates input with `src/lib/` functions and persists the whole document.
- Async work handles failure: show a readable message (pt-BR) and never leave the UI in a loading state.

## React Native

- Styles: `StyleSheet.create` at the bottom of the file; colors from `theme/colors.ts`, text styles spread from `theme/typography.ts`. No hex colors or repeated magic numbers in components.
- Use `Pressable` for touchables. Interactive elements are at least 44 x 44 dp (use `hitSlop` when the visual is smaller).
- Accessibility: every icon-only button has `accessibilityLabel`; interactive elements set `accessibilityRole`; selected or checked state uses `accessibilityState`; decorative images are hidden from screen readers.
- Lists with potentially many rows use `FlatList` (or `SectionList`), not `.map` inside `ScrollView`. Short fixed lists (tabs, weekdays) may use `.map`.
- Respect safe areas with `react-native-safe-area-context` insets (top and bottom). Forms must stay usable with the keyboard open and with large font scale; do not disable font scaling.
- Text must not overflow: use `numberOfLines` where a single line is intended.
- Use platform-neutral code; this app targets Android only, so do not add iOS or web branches.
- Icons come from `@expo/vector-icons` (Ionicons) only. Do not add another icon set.

## Expo and dependencies

- Add Expo-compatible packages with `npx expo install <package>`; run `npx expo install --check` after dependency changes.
- Configuration lives in `app.json` and config plugins. Do not hand-edit the generated `android/` folder (it is gitignored).
- Image assets live in `assets/`; reference them with `require` and a static path.
- Add a dependency only when stdlib, React Native or an installed package cannot do the job in a few lines. Remove unused dependencies (Knip enforces this).

## TypeScript

- `strict` stays on. No `any`, no `@ts-ignore`; use `unknown` and narrow, or fix the type.
- Domain types (`AppState`, `House`, `Routine`, `OneOff`, `ShoppingItem`) are defined once in `src/lib/appState.ts` and imported everywhere.
- Prefer union literals (`'week' | 'shopping' | 'maintenance'`) over enums and loose strings.
- Export only what other modules use (Knip flags the rest).

## Naming

- Files: components `PascalCase.tsx`; hooks `useThing.ts`; logic `camelCase.ts`; tests `name.test.ts` next to the file.
- Handlers: `onPress`, `onChange...` for props; `handle...` for internal functions.
- Booleans read as questions: `isBought`, `hasItems`.
- Code, identifiers and comments in English; visible UI text in Brazilian Portuguese (see `ui-copy-policy.md`).

## Review checklist

Before closing a task, confirm:

- No logic that belongs in `src/lib/` is inside a component, and new logic has tests.
- No duplicated structure that should be a `common/` component.
- No hard-coded colors, no `any`, no unexplained `useEffect`.
- Touch targets, labels and states are accessible; the screen works with a narrow width and large font.
- `npm run check` passes.
