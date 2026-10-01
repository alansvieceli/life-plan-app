# Spec 001 - Life Plan App

## Objective

Build `life-plan-app`, a personal Android app (React Native, Expo, TypeScript) that organizes the user's week (recurring routine plus one-off activities) and a shopping list split across the user's houses, with local backup and restore.

## Context

- Single user, Android only, offline-first. All data stays on the device.
- Reuses the patterns of `C:\projetos\app\cycle12-finance-app`: one JSON document in AsyncStorage, `.c12f`-style backup file with SHA-256 integrity, `@expo/vector-icons` (Ionicons), `theme/colors.ts` + `theme/typography.ts`, pill `TabBar`, native splash via `expo-splash-screen`, Biome, Knip, Jest.
- Visual identity: calm and cozy (paper tones, sage green, serif titles). Approved mockups: `.superpowers/brainstorm/1059-1790872505/content/telas-v1.html`.
- UI copy is Brazilian Portuguese, sentence case, per `docs/standards/ui-copy-policy.md`.

## Goals

- Weekly planner with recurring routines and one-off activities, each with a start time and a duration.
- Shopping list where every item belongs to one house; houses are a user-managed list.
- Maintenance tab: manage houses, backup, restore, reset.
- App header with app icon and a time-based greeting, a native splash while data loads, and an app icon.

## Non-goals

- No backend, authentication, cloud sync, paid services, or encryption.
- No notifications or alarms.
- No "done" state for activities (only shopping items can be marked bought).
- No shopping categories or quantities.
- No dark mode, no iOS or web targets.
- No activities that cross midnight (the activity belongs to its start day; duration is only displayed).
- No navigation library; the 3 tabs are plain component state.

## Data Model

Single document under AsyncStorage key `@life-plan-app/state/v1`:

```ts
type AppState = {
  houses: { id: string; name: string }[];                       // at least 1
  routines: { id: string; title: string; weekdays: number[];    // 0 = Sunday ... 6 = Saturday, at least 1
              startTime: string; durationMin: number }[];      // "HH:mm", 1..1440
  oneOffs:  { id: string; title: string; date: string;          // "YYYY-MM-DD"
              startTime: string; durationMin: number }[];
  shoppingItems: { id: string; name: string; houseId: string; bought: boolean }[];
};
```

Default / reset state: houses `Casa 1` and `Casa 2`; every other list empty.

Rules:

- Titles and names are trimmed and must be non-empty.
- Every shopping item references an existing house.
- A house that still has shopping items cannot be deleted. The last house cannot be deleted.
- Ids come from a small `ids.ts` helper.

## Screens

### Shell

- Header (all tabs): app icon + `Life Plan` wordmark (serif), then a greeting line.
- Greeting by local hour: 05-11 `Bom dia`, 12-17 `Boa tarde`, otherwise `Boa noite`, followed by ` :)`. Pure function with tests.
- Pill `TabBar` at the bottom: `Semana` (`calendar-outline`), `Compras` (`cart-outline`), `Manutenção` (`settings-outline`). Active tab uses `accent` fill.

### Semana

- Week selector (previous/next arrows, `Semana N`, selected day title such as `Terça, 6 out`) and a 7-day strip. Today is selected on open.
- Day list sorted by start time, merging routines whose `weekdays` include the day and one-offs whose `date` equals the day.
- Card: colored left stripe, title, `08:00-12:00 · 4h`, icon `repeat` for routine or `calendar-outline` for one-off, and `alert-circle-outline` (amber) when it overlaps another activity of the same day. Overlap never blocks saving.
- Floating `add` button opens the form: title, start time, duration, and type `Repete toda semana` (weekday picker) or `Só neste dia` (date).
- Tap a card to edit or delete (delete asks for confirmation). Editing or deleting a routine affects every week and the form says so.
- Empty day shows a friendly empty message.

### Compras

- Horizontally scrollable filter chips: `Todas` plus one per house.
- Add row on top: name input, house selector (remembers the last house used), add button.
- `Todas` groups items by house; a house chip shows only that house.
- Tap an item to toggle bought (struck through, sorted to the end of its group). Trash icon deletes. `Limpar comprados` removes all bought items after confirmation.

### Manutenção

- `Casas`: list with inline rename, delete, and `Adicionar casa`. Blocked deletes show `Mova ou exclua os itens desta casa antes.`
- `Dados`: `Fazer backup`, `Restaurar backup`, `Limpar tudo` (confirmation), plus a status/error message area. Restore and reset warn that they replace current data.

## Backup

- File `life-plan-backup-YYYY-MM-DD.lpb`, JSON envelope:

```json
{
  "format": "life-plan-backup",
  "formatVersion": 1,
  "exportedAt": "2026-10-01T12:00:00.000Z",
  "app": { "name": "Life Plan", "storageVersion": 1 },
  "integrity": { "algorithm": "SHA-256", "canonicalPayloadHash": "..." },
  "data": { "houses": [], "routines": [], "oneOffs": [], "shoppingItems": [] }
}
```

- Hash: canonical JSON (sorted keys, `integrity` excluded) with SHA-256 via `expo-crypto`. It detects accidental or casual edits only; it is not anti-forgery.
- Restore validates in order: JSON parse, envelope (`format`, `formatVersion`, `data`), integrity hash, field shapes (weekdays 0-6, `HH:mm`, `YYYY-MM-DD`, durations, booleans, string ids), references (items point to existing houses), at least 1 house. Only after every step passes is the state replaced. Any failure leaves current data unchanged and shows a readable error:
  - `Arquivo inválido ou corrompido.`
  - `Este arquivo não é um backup do Life Plan.`
  - `Versão de backup não suportada.`
  - `Backup inválido: o conteúdo foi alterado ou está corrompido.`
  - `Backup inválido: há itens ligados a casas que não existem.`
- Export uses `expo-file-system` + `expo-sharing`; import uses `expo-document-picker`.

## Branding

- **App icon:** sage-green glyph on paper background (a calendar page with a leaf/check mark). Files: `assets/app-icon.png` (1024), `assets/adaptive-icon-foreground.png` (1024, transparent, inside the Android safe zone), adaptive background `#F6F1E9`, `assets/favicon.png`.
- **Header logo:** `assets/app-icon.png` rendered small, next to a `Life Plan` serif text wordmark (no separate header image).
- **Splash:** native splash through the `expo-splash-screen` plugin (`assets/splash-logo.png`, background `#F6F1E9`, `contain`). The splash stays visible (`preventAutoHideAsync`) until the state is loaded from AsyncStorage, then `hideAsync()`.
- `app.json`: name `Life Plan`, slug `life-plan-app`, Android package `br.com.lifeplan.app`, portrait, light UI.
- Image assets are generated once with a throwaway script; the script is not kept in the repo.

## Theme

`src/theme/colors.ts` (same token names as cycle12): `background #F6F1E9`, `surface #FFFFFF`, `surfaceMuted #EEE7DA`, `border #E2D9C8`, `textPrimary #3B3A36`, `textSecondary #8A8578`, `accent #7C9A7E`, `accentText #FFFFFF`, `positive #7C9A7E`, `negative #C0705F`, `warning #D9A66B`, `info #6F93A8`, plus an activity stripe palette (`#7C9A7E`, `#D9A66B`, `#6F93A8`, `#B98BA8`). `typography.ts` mirrors cycle12 with a serif family for `screenTitle` and `sectionTitle`.

## Architecture

```
src/
  lib/          schedule, shopping, appState, backup, dates, formatters, greeting, ids   (pure, tested)
  hooks/        useAppState.ts   load/save AsyncStorage + all actions
  components/   common/ (ActionButton, ModalShell, TabBar, fields), week/, shopping/, maintenance/
  theme/        colors.ts, typography.ts, sharedStyles.ts
App.tsx
```

- Screens consume `useAppState` only; they never touch AsyncStorage.
- Dependencies (minimum): `@react-native-async-storage/async-storage`, `@expo/vector-icons`, `expo-crypto`, `expo-file-system`, `expo-sharing`, `expo-document-picker`, `expo-splash-screen`, `react-native-svg` only if a component needs it.
- Dev tooling follows cycle12: Biome, Knip, Jest, `jscpd`, and the `npm run check` script from `docs/standards/spec-completion-policy.md`.

## Delivery Plans

One spec, four plans executed one task at a time:

1. `001` Expo bootstrap, tooling, theme, branding assets, header, splash, empty 3-tab shell.
2. `002` State, storage, houses, backup/restore/reset (Manutenção).
3. `003` Compras.
4. `004` Semana.

## Tests (required by testing-policy)

- Schedule: end time, weekday match for routines, one-off date match, merge and sort, overlap detection.
- Shopping: group by house, filter, clear bought, house-delete blocking.
- Backup: valid round trip; invalid JSON; wrong format; unsupported version; hash mismatch; broken house reference; zero houses; reset defaults.
- Dates and formatters: week number, weekday, `YYYY-MM-DD`, durations (`4h`, `1h30`), time ranges.
- Greeting by hour boundaries.
- Purely visual components need no tests.

## Acceptance Criteria

- Three tabs work as described; header shows icon, wordmark, and greeting on every tab.
- Native splash shows until state is loaded, then hides.
- App icon and name appear correctly on the Android launcher.
- Routines repeat weekly; one-offs appear only on their date; overlaps are flagged but allowed.
- Shopping items belong to a house; bought toggle, delete, and clear bought work; houses are managed in Manutenção with the delete rules above.
- Backup, restore (atomic, validated), and reset behave as specified; invalid restore never changes data.
- `npm run check` passes; `src/lib/` coverage above 80%; duplication at or below 5%.
- App starts on the Android emulator with `expo start`.
- `README.md` and `docs/app-context.md` are updated per their policies.

## Assumptions

- A 24-hour clock (`HH:mm`) is used everywhere.
- The week starts on Sunday.
- Duration is entered as hours and minutes and stored in minutes.
