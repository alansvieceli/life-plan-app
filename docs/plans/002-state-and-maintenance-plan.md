# Plan 002 - State, Storage, Houses and Maintenance

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the app state as one JSON document, gate the splash on loading it, and ship the `Manutenção` tab: manage houses, back up, restore (validated) and reset.

**Architecture:** Domain types, validation, house rules and backup logic are pure functions in `src/lib/` (unit tested, SHA-256 injected). One hook, `useAppState`, is the only code that touches AsyncStorage. File and hashing APIs live in `src/services/`. UI is small presentational components composed by `MaintenanceScreen`.

**Tech Stack:** `@react-native-async-storage/async-storage`, `expo-crypto`, `expo-file-system`, `expo-sharing`, `expo-document-picker`, existing Expo/RN/Jest/Biome/Knip setup.

**Spec:** `docs/specs/001-life-plan-app.md` (plan 2 of 4). Depends on plan 001 (done).

## Global Constraints

- Android only; no backend, authentication, paid services, or unnecessary dependencies.
- TypeScript `strict`, no `any`; Biome (single quotes, semicolons, trailing commas, width 88); Knip clean (`npm run check`).
- Follow `docs/standards/react-native-standards.md` (reuse `components/common/`, theme tokens, 44 dp touch targets, `accessibilityLabel` on icon-only buttons, no business logic in components).
- UI copy in Brazilian Portuguese, sentence case (`docs/standards/ui-copy-policy.md`); code and comments in English.
- Storage key `@life-plan-app/state/v1`; backup file `life-plan-backup-YYYY-MM-DD.lpb`; format `life-plan-backup`, `formatVersion` 1, SHA-256 over canonical JSON (sorted keys, `integrity` excluded).
- Houses: a free list, at least 1; default state has `Casa 1` and `Casa 2`; a house with shopping items cannot be deleted; the last house cannot be deleted.
- Restore is atomic: validate everything first, replace state only on success; any failure leaves current data unchanged.
- `src/lib/` coverage above 80%; duplication at or below 5%.
- Commits use `type: message` (Husky `commit-msg`); end with the `Co-Authored-By` line the session provides.

## Review Focus

- Stored JSON that is corrupted, from an older shape, or unreadable must not crash the app or silently lose the user's data: the invalid raw text is kept under `<key>.invalid` and a failed read blocks saving (Task 1 test for `parseStoredState`; Task 4 hook logic).
- A backup hand-edited after export (for example a renamed house) must be rejected as altered (Task 3 test).
- A backup whose items point to a house that does not exist must be rejected and leave current data unchanged (Task 3 test).
- Deleting a house with items, and deleting the last house, must be blocked with a readable message (Task 2 tests; Task 5 UI).
- Renaming a house to blank or whitespace must not wipe its name (Task 2 test; Task 5 reverts the input).
- Cancelling the file picker during restore must change nothing (Task 5, manual).

---

### Task 1: Domain state, validation and stored-state parsing (TDD)

**Files:**
- Create: `src/lib/ids.ts`, `src/lib/ids.test.ts`, `src/lib/appState.ts`, `src/lib/appState.test.ts`, `src/lib/stateFixtures.ts`
- Modify: `jest.config.js`, `knip.json`

**Interfaces:**
- Produces from `ids.ts`: `createId(prefix: string): string`.
- Produces from `appState.ts`: types `House`, `Routine`, `OneOff`, `ShoppingItem`, `AppState`; `type StateCheck = { ok: true; state: AppState } | { ok: false; reason: 'shape' | 'references' }`; `createDefaultState(): AppState`; `validateAppState(value: unknown): StateCheck`; `parseStoredState(raw: string | null): { state: AppState; wasInvalid: boolean }`; `isRecord(value: unknown): value is Record<string, unknown>`.
- Produces from `stateFixtures.ts` (test support only): `createSampleState(): AppState`.

- [ ] **Step 1: Test-support config**

`src/lib/stateFixtures.ts`:

```ts
import type { AppState } from './appState';

export function createSampleState(): AppState {
  return {
    houses: [
      { id: 'house-a', name: 'Casa 1' },
      { id: 'house-b', name: 'Sítio' },
    ],
    routines: [
      {
        id: 'routine-1',
        title: 'Trabalhar',
        weekdays: [1, 2, 3, 4, 5],
        startTime: '08:00',
        durationMin: 240,
      },
    ],
    oneOffs: [
      {
        id: 'oneoff-1',
        title: 'Dentista',
        date: '2026-10-06',
        startTime: '15:30',
        durationMin: 60,
      },
    ],
    shoppingItems: [{ id: 'item-1', name: 'Café', houseId: 'house-a', bought: false }],
  };
}
```

`jest.config.js` (exclude fixtures from coverage):

```js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/?(*.)+(test).[tj]s?(x)'],
  collectCoverageFrom: [
    'src/lib/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*Fixtures.ts',
  ],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
```

`knip.json` (fixtures are test-only):

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "project": ["**/*.{js,jsx,ts,tsx}!", "!jest.setup.ts!", "!src/lib/stateFixtures.ts!"],
  "ignoreDependencies": ["expo-system-ui", "expo-updates"]
}
```

- [ ] **Step 2: Write the failing tests**

`src/lib/ids.test.ts`:

```ts
import { createId } from './ids';

describe('createId', () => {
  it('starts with the given prefix', () => {
    expect(createId('house')).toMatch(/^house-\d+-\d+$/);
  });
});
```

`src/lib/appState.test.ts`:

```ts
import { createDefaultState, parseStoredState, validateAppState } from './appState';
import { createSampleState } from './stateFixtures';

describe('createDefaultState', () => {
  it('has two houses and empty lists', () => {
    const state = createDefaultState();
    expect(state.houses.map((house) => house.name)).toEqual(['Casa 1', 'Casa 2']);
    expect(state.routines).toEqual([]);
    expect(state.oneOffs).toEqual([]);
    expect(state.shoppingItems).toEqual([]);
  });
});

describe('validateAppState', () => {
  it('accepts a valid state unchanged', () => {
    const sample = createSampleState();
    expect(validateAppState(sample)).toEqual({ ok: true, state: sample });
  });

  it('trims house names and titles', () => {
    const sample = createSampleState();
    sample.houses[0].name = '  Casa 1  ';
    sample.routines[0].title = ' Trabalhar ';
    const check = validateAppState(sample);
    expect(check.ok && check.state.houses[0].name).toBe('Casa 1');
    expect(check.ok && check.state.routines[0].title).toBe('Trabalhar');
  });

  it.each([null, 'text', 42, []])('rejects a non-object (%p)', (value) => {
    expect(validateAppState(value)).toEqual({ ok: false, reason: 'shape' });
  });

  const invalidShapes: [string, (s: ReturnType<typeof createSampleState>) => unknown][] = [
    ['no houses', (s) => ({ ...s, houses: [] })],
    ['blank house name', (s) => ({ ...s, houses: [{ id: 'house-a', name: '  ' }] })],
    ['routines not an array', (s) => ({ ...s, routines: 'x' })],
    ['weekday out of range', (s) => ({ ...s, routines: [{ ...s.routines[0], weekdays: [7] }] })],
    ['empty weekdays', (s) => ({ ...s, routines: [{ ...s.routines[0], weekdays: [] }] })],
    ['bad time', (s) => ({ ...s, routines: [{ ...s.routines[0], startTime: '24:00' }] })],
    ['zero duration', (s) => ({ ...s, routines: [{ ...s.routines[0], durationMin: 0 }] })],
    ['duration over a day', (s) => ({ ...s, routines: [{ ...s.routines[0], durationMin: 1441 }] })],
    ['impossible date', (s) => ({ ...s, oneOffs: [{ ...s.oneOffs[0], date: '2026-02-30' }] })],
    ['bought not boolean', (s) => ({ ...s, shoppingItems: [{ ...s.shoppingItems[0], bought: 'yes' }] })],
  ];

  it.each(invalidShapes)('rejects %s', (_name, mutate) => {
    expect(validateAppState(mutate(createSampleState()))).toEqual({
      ok: false,
      reason: 'shape',
    });
  });

  it('rejects an item that points to a missing house', () => {
    const sample = createSampleState();
    sample.shoppingItems[0].houseId = 'house-zzz';
    expect(validateAppState(sample)).toEqual({ ok: false, reason: 'references' });
  });
});

describe('parseStoredState', () => {
  it('returns the default state when nothing is stored', () => {
    expect(parseStoredState(null)).toEqual({
      state: createDefaultState(),
      wasInvalid: false,
    });
  });

  it('returns the stored state when it is valid', () => {
    const sample = createSampleState();
    expect(parseStoredState(JSON.stringify(sample))).toEqual({
      state: sample,
      wasInvalid: false,
    });
  });

  it('flags text that is not JSON', () => {
    expect(parseStoredState('{oops')).toEqual({
      state: createDefaultState(),
      wasInvalid: true,
    });
  });

  it('flags JSON with the wrong shape', () => {
    expect(parseStoredState('{"houses":[]}')).toEqual({
      state: createDefaultState(),
      wasInvalid: true,
    });
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx jest src/lib`
Expected: FAIL, "Cannot find module './ids'" and "./appState".

- [ ] **Step 4: Implement**

`src/lib/ids.ts`:

```ts
export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}
```

`src/lib/appState.ts`:

```ts
export type House = { id: string; name: string };

export type Routine = {
  id: string;
  title: string;
  weekdays: number[];
  startTime: string;
  durationMin: number;
};

export type OneOff = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  durationMin: number;
};

export type ShoppingItem = {
  id: string;
  name: string;
  houseId: string;
  bought: boolean;
};

export type AppState = {
  houses: House[];
  routines: Routine[];
  oneOffs: OneOff[];
  shoppingItems: ShoppingItem[];
};

export type StateCheck =
  | { ok: true; state: AppState }
  | { ok: false; reason: 'shape' | 'references' };

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function createDefaultState(): AppState {
  return {
    houses: [
      { id: 'house-default-1', name: 'Casa 1' },
      { id: 'house-default-2', name: 'Casa 2' },
    ],
    routines: [],
    oneOffs: [],
    shoppingItems: [],
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isDuration(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 1440;
}

function isWeekdays(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)
  );
}

function parseList<T>(value: unknown, parseItem: (item: unknown) => T | null) {
  if (!Array.isArray(value)) return null;
  const parsed: T[] = [];
  for (const item of value) {
    const result = parseItem(item);
    if (result === null) return null;
    parsed.push(result);
  }
  return parsed;
}

function parseHouse(value: unknown): House | null {
  if (!isRecord(value) || !isText(value.id) || !isText(value.name)) return null;
  return { id: value.id, name: value.name.trim() };
}

function parseRoutine(value: unknown): Routine | null {
  if (
    !isRecord(value) ||
    !isText(value.id) ||
    !isText(value.title) ||
    !isWeekdays(value.weekdays) ||
    !isTime(value.startTime) ||
    !isDuration(value.durationMin)
  ) {
    return null;
  }
  return {
    id: value.id,
    title: value.title.trim(),
    weekdays: value.weekdays,
    startTime: value.startTime,
    durationMin: value.durationMin,
  };
}

function parseOneOff(value: unknown): OneOff | null {
  if (
    !isRecord(value) ||
    !isText(value.id) ||
    !isText(value.title) ||
    !isDate(value.date) ||
    !isTime(value.startTime) ||
    !isDuration(value.durationMin)
  ) {
    return null;
  }
  return {
    id: value.id,
    title: value.title.trim(),
    date: value.date,
    startTime: value.startTime,
    durationMin: value.durationMin,
  };
}

function parseShoppingItem(value: unknown): ShoppingItem | null {
  if (
    !isRecord(value) ||
    !isText(value.id) ||
    !isText(value.name) ||
    !isText(value.houseId) ||
    typeof value.bought !== 'boolean'
  ) {
    return null;
  }
  return {
    id: value.id,
    name: value.name.trim(),
    houseId: value.houseId,
    bought: value.bought,
  };
}

export function validateAppState(value: unknown): StateCheck {
  if (!isRecord(value)) return { ok: false, reason: 'shape' };

  const houses = parseList(value.houses, parseHouse);
  const routines = parseList(value.routines, parseRoutine);
  const oneOffs = parseList(value.oneOffs, parseOneOff);
  const shoppingItems = parseList(value.shoppingItems, parseShoppingItem);
  if (!houses || houses.length === 0 || !routines || !oneOffs || !shoppingItems) {
    return { ok: false, reason: 'shape' };
  }

  const houseIds = new Set(houses.map((house) => house.id));
  if (!shoppingItems.every((item) => houseIds.has(item.houseId))) {
    return { ok: false, reason: 'references' };
  }
  return { ok: true, state: { houses, routines, oneOffs, shoppingItems } };
}

export function parseStoredState(raw: string | null) {
  if (raw === null) return { state: createDefaultState(), wasInvalid: false };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { state: createDefaultState(), wasInvalid: true };
  }
  const check = validateAppState(parsed);
  return check.ok
    ? { state: check.state, wasInvalid: false }
    : { state: createDefaultState(), wasInvalid: true };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest src/lib`
Expected: PASS. Then `npm run fix` and `npm run check`; expected: green (Knip production may flag `isRecord` until Task 3 imports it; if so, defer that one check to Task 3 and ledger it).

- [ ] **Step 6: Commit**

```bash
git add src/lib jest.config.js knip.json
git commit -m "feat: add app state model, validation and stored-state parsing"
```

---

### Task 2: House rules (TDD)

**Files:**
- Create: `src/lib/houses.ts`
- Test: `src/lib/houses.test.ts`

**Interfaces:**
- Consumes: `AppState` from `appState.ts`; `createSampleState` from `stateFixtures.ts`.
- Produces: `type DeleteBlock = 'has-items' | 'last-house'`; `addHouse(state, id, name): AppState`; `renameHouse(state, id, name): AppState`; `deleteBlockReason(state, id): DeleteBlock | null`; `deleteHouse(state, id): AppState`.

- [ ] **Step 1: Write the failing test**

`src/lib/houses.test.ts`:

```ts
import { addHouse, deleteBlockReason, deleteHouse, renameHouse } from './houses';
import { createSampleState } from './stateFixtures';

describe('addHouse', () => {
  it('appends a trimmed house', () => {
    const state = addHouse(createSampleState(), 'house-c', '  Praia ');
    expect(state.houses.map((house) => house.name)).toEqual(['Casa 1', 'Sítio', 'Praia']);
  });

  it('ignores a blank name', () => {
    const sample = createSampleState();
    expect(addHouse(sample, 'house-c', '   ')).toBe(sample);
  });
});

describe('renameHouse', () => {
  it('renames only the target house', () => {
    const state = renameHouse(createSampleState(), 'house-b', ' Fazenda ');
    expect(state.houses.map((house) => house.name)).toEqual(['Casa 1', 'Fazenda']);
  });

  it('keeps the old name when the new one is blank', () => {
    const sample = createSampleState();
    expect(renameHouse(sample, 'house-b', '  ')).toBe(sample);
  });
});

describe('deleteBlockReason', () => {
  it('blocks a house that still has items', () => {
    expect(deleteBlockReason(createSampleState(), 'house-a')).toBe('has-items');
  });

  it('allows an empty house when another house remains', () => {
    expect(deleteBlockReason(createSampleState(), 'house-b')).toBeNull();
  });

  it('blocks deleting the last house', () => {
    const sample = createSampleState();
    sample.houses = [sample.houses[1]];
    expect(deleteBlockReason(sample, 'house-b')).toBe('last-house');
  });
});

describe('deleteHouse', () => {
  it('removes an empty house', () => {
    const state = deleteHouse(createSampleState(), 'house-b');
    expect(state.houses.map((house) => house.id)).toEqual(['house-a']);
  });

  it('leaves the state unchanged when blocked', () => {
    const sample = createSampleState();
    expect(deleteHouse(sample, 'house-a')).toBe(sample);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/lib/houses.test.ts`
Expected: FAIL, "Cannot find module './houses'".

- [ ] **Step 3: Implement**

`src/lib/houses.ts`:

```ts
import type { AppState } from './appState';

export type DeleteBlock = 'has-items' | 'last-house';

export function addHouse(state: AppState, id: string, name: string): AppState {
  const trimmed = name.trim();
  if (trimmed === '') return state;
  return { ...state, houses: [...state.houses, { id, name: trimmed }] };
}

export function renameHouse(state: AppState, id: string, name: string): AppState {
  const trimmed = name.trim();
  if (trimmed === '') return state;
  return {
    ...state,
    houses: state.houses.map((house) =>
      house.id === id ? { ...house, name: trimmed } : house,
    ),
  };
}

export function deleteBlockReason(state: AppState, id: string): DeleteBlock | null {
  if (state.houses.length <= 1) return 'last-house';
  if (state.shoppingItems.some((item) => item.houseId === id)) return 'has-items';
  return null;
}

export function deleteHouse(state: AppState, id: string): AppState {
  if (deleteBlockReason(state, id) !== null) return state;
  return { ...state, houses: state.houses.filter((house) => house.id !== id) };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest src/lib/houses.test.ts` then `npm run test:coverage`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/houses.ts src/lib/houses.test.ts
git commit -m "feat: add house rules"
```

---

### Task 3: Backup envelope, integrity and restore validation (TDD)

**Files:**
- Create: `src/lib/backup.ts`
- Test: `src/lib/backup.test.ts`

**Interfaces:**
- Consumes: `AppState`, `validateAppState`, `isRecord` from `appState.ts`; `createSampleState`.
- Produces: `type Sha256 = (text: string) => Promise<string>`; `type RestoreResult = { ok: true; state: AppState } | { ok: false; error: string }`; `createBackupText(state, exportedAt: Date, sha256): Promise<string>`; `parseBackupText(text, sha256): Promise<RestoreResult>`; `backupFileName(date: Date): string`.

- [ ] **Step 1: Write the failing test**

`src/lib/backup.test.ts`:

```ts
import { backupFileName, createBackupText, parseBackupText, type Sha256 } from './backup';
import { createSampleState } from './stateFixtures';

// Deterministic stand-in for SHA-256; the real hash comes from expo-crypto in the app.
const sha256: Sha256 = async (text) => {
  let hash = 7;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `h${text.length}-${hash}`;
};

const exportedAt = new Date('2026-10-01T12:00:00.000Z');

async function sampleBackup() {
  return createBackupText(createSampleState(), exportedAt, sha256);
}

describe('backup round trip', () => {
  it('restores exactly what was exported', async () => {
    const result = await parseBackupText(await sampleBackup(), sha256);
    expect(result).toEqual({ ok: true, state: createSampleState() });
  });

  it('writes the documented envelope', async () => {
    const envelope = JSON.parse(await sampleBackup());
    expect(envelope).toMatchObject({
      format: 'life-plan-backup',
      formatVersion: 1,
      exportedAt: '2026-10-01T12:00:00.000Z',
      app: { name: 'Life Plan', storageVersion: 1 },
      integrity: { algorithm: 'SHA-256' },
    });
    expect(typeof envelope.integrity.canonicalPayloadHash).toBe('string');
  });
});

describe('parseBackupText rejections', () => {
  it('rejects text that is not JSON', async () => {
    expect(await parseBackupText('{oops', sha256)).toEqual({
      ok: false,
      error: 'Arquivo inválido ou corrompido.',
    });
  });

  it('rejects JSON that is not an object', async () => {
    expect(await parseBackupText('[1,2]', sha256)).toEqual({
      ok: false,
      error: 'Arquivo inválido ou corrompido.',
    });
  });

  it('rejects another format', async () => {
    expect(await parseBackupText('{"format":"other"}', sha256)).toEqual({
      ok: false,
      error: 'Este arquivo não é um backup do Life Plan.',
    });
  });

  it('rejects an unsupported version', async () => {
    const envelope = JSON.parse(await sampleBackup());
    envelope.formatVersion = 2;
    expect(await parseBackupText(JSON.stringify(envelope), sha256)).toEqual({
      ok: false,
      error: 'Versão de backup não suportada.',
    });
  });

  it('rejects a missing integrity section', async () => {
    const envelope = JSON.parse(await sampleBackup());
    delete envelope.integrity;
    expect(await parseBackupText(JSON.stringify(envelope), sha256)).toEqual({
      ok: false,
      error: 'Backup inválido: o conteúdo foi alterado ou está corrompido.',
    });
  });

  it('rejects an unsupported hash algorithm', async () => {
    const envelope = JSON.parse(await sampleBackup());
    envelope.integrity.algorithm = 'MD5';
    expect(await parseBackupText(JSON.stringify(envelope), sha256)).toEqual({
      ok: false,
      error: 'Backup inválido: o conteúdo foi alterado ou está corrompido.',
    });
  });

  it('rejects content edited after export (renamed house)', async () => {
    const envelope = JSON.parse(await sampleBackup());
    envelope.data.houses[0].name = 'Outra casa';
    expect(await parseBackupText(JSON.stringify(envelope), sha256)).toEqual({
      ok: false,
      error: 'Backup inválido: o conteúdo foi alterado ou está corrompido.',
    });
  });

  it('rejects items that point to a missing house', async () => {
    const state = createSampleState();
    state.shoppingItems[0].houseId = 'house-zzz';
    const text = await createBackupText(state, exportedAt, sha256);
    expect(await parseBackupText(text, sha256)).toEqual({
      ok: false,
      error: 'Backup inválido: há itens ligados a casas que não existem.',
    });
  });

  it('rejects a backup with no houses', async () => {
    const state = { ...createSampleState(), houses: [], shoppingItems: [] };
    const text = await createBackupText(state, exportedAt, sha256);
    expect(await parseBackupText(text, sha256)).toEqual({
      ok: false,
      error: 'Arquivo inválido ou corrompido.',
    });
  });
});

describe('backupFileName', () => {
  it('uses the local date and the .lpb extension', () => {
    expect(backupFileName(new Date(2026, 9, 6, 8, 0))).toBe(
      'life-plan-backup-2026-10-06.lpb',
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/lib/backup.test.ts`
Expected: FAIL, "Cannot find module './backup'".

- [ ] **Step 3: Implement**

`src/lib/backup.ts`:

```ts
import { type AppState, isRecord, validateAppState } from './appState';

const BACKUP_FORMAT = 'life-plan-backup';
const FORMAT_VERSION = 1;
const STORAGE_VERSION = 1;
const HASH_ALGORITHM = 'SHA-256';

export type Sha256 = (text: string) => Promise<string>;

export type RestoreResult =
  | { ok: true; state: AppState }
  | { ok: false; error: string };

const errors = {
  invalidFile: 'Arquivo inválido ou corrompido.',
  notBackup: 'Este arquivo não é um backup do Life Plan.',
  unsupportedVersion: 'Versão de backup não suportada.',
  tampered: 'Backup inválido: o conteúdo foi alterado ou está corrompido.',
  references: 'Backup inválido: há itens ligados a casas que não existem.',
} as const;

function fail(error: string): RestoreResult {
  return { ok: false, error };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1));
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function createBackupText(
  state: AppState,
  exportedAt: Date,
  sha256: Sha256,
) {
  const body = {
    format: BACKUP_FORMAT,
    formatVersion: FORMAT_VERSION,
    exportedAt: exportedAt.toISOString(),
    app: { name: 'Life Plan', storageVersion: STORAGE_VERSION },
    data: state,
  };
  const canonicalPayloadHash = await sha256(canonicalJson(body));
  return JSON.stringify(
    { ...body, integrity: { algorithm: HASH_ALGORITHM, canonicalPayloadHash } },
    null,
    2,
  );
}

export async function parseBackupText(
  text: string,
  sha256: Sha256,
): Promise<RestoreResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail(errors.invalidFile);
  }
  if (!isRecord(parsed)) return fail(errors.invalidFile);
  if (parsed.format !== BACKUP_FORMAT) return fail(errors.notBackup);
  if (parsed.formatVersion !== FORMAT_VERSION) return fail(errors.unsupportedVersion);

  const { integrity, ...body } = parsed;
  if (
    !isRecord(integrity) ||
    integrity.algorithm !== HASH_ALGORITHM ||
    typeof integrity.canonicalPayloadHash !== 'string' ||
    (await sha256(canonicalJson(body))) !== integrity.canonicalPayloadHash
  ) {
    return fail(errors.tampered);
  }

  const check = validateAppState(parsed.data);
  if (!check.ok) {
    return fail(check.reason === 'references' ? errors.references : errors.invalidFile);
  }
  return { ok: true, state: check.state };
}

export function backupFileName(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `life-plan-backup-${day}.lpb`;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest src/lib` then `npm run check`
Expected: PASS; coverage for `src/lib/` above 80% (aim for 100% of `backup.ts`). Knip production clean (`isRecord` is now used).

- [ ] **Step 5: Commit**

```bash
git add src/lib/backup.ts src/lib/backup.test.ts
git commit -m "feat: add backup envelope with integrity check and validated restore"
```

---

### Task 4: Persistence hook and splash gating

**Files:**
- Create: `src/hooks/useAppState.ts`
- Modify: `src/LifePlanApp.tsx`, `App.tsx`, `package.json` (via install)

**Interfaces:**
- Consumes: `AppState`, `createDefaultState`, `parseStoredState`; `addHouse`, `renameHouse`, `deleteHouse`, `deleteBlockReason`, `DeleteBlock`; `createId`.
- Produces: `useAppState()` returning `AppStore`:

```ts
{
  state: AppState; isLoaded: boolean; saveError: string | null;
  addHouse(name: string): void; renameHouse(id: string, name: string): void;
  deleteHouse(id: string): void; getDeleteBlock(id: string): DeleteBlock | null;
  replaceState(next: AppState): void; resetState(): void;
}
```

and `export type AppStore = ReturnType<typeof useAppState>`.

- [ ] **Step 1: Install**

Run: `npx expo install @react-native-async-storage/async-storage`
Run: `npx expo install --check`
Expected: installs; "Dependencies are up to date".

- [ ] **Step 2: Create the hook**

`src/hooks/useAppState.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { type AppState, createDefaultState, parseStoredState } from '../lib/appState';
import {
  addHouse,
  type DeleteBlock,
  deleteBlockReason,
  deleteHouse,
  renameHouse,
} from '../lib/houses';
import { createId } from '../lib/ids';

const STORAGE_KEY = '@life-plan-app/state/v1';
const LOAD_ERROR = 'Não foi possível ler os dados salvos.';
const SAVE_ERROR = 'Não foi possível salvar os dados.';

export function useAppState() {
  const [state, setState] = useState<AppState>(createDefaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // A failed read must never be followed by a save that overwrites the stored data.
  const canSave = useRef(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (raw) => {
        const loaded = parseStoredState(raw);
        if (loaded.wasInvalid && raw !== null) {
          await AsyncStorage.setItem(`${STORAGE_KEY}.invalid`, raw);
        }
        setState(loaded.state);
      })
      .catch(() => {
        canSave.current = false;
        setSaveError(LOAD_ERROR);
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const update = useCallback((next: AppState) => {
    setState(next);
    if (!canSave.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      .then(() => setSaveError(null))
      .catch(() => setSaveError(SAVE_ERROR));
  }, []);

  return {
    state,
    isLoaded,
    saveError,
    addHouse: (name: string) => update(addHouse(state, createId('house'), name)),
    renameHouse: (id: string, name: string) => update(renameHouse(state, id, name)),
    deleteHouse: (id: string) => update(deleteHouse(state, id)),
    getDeleteBlock: (id: string): DeleteBlock | null => deleteBlockReason(state, id),
    replaceState: update,
    resetState: () => update(createDefaultState()),
  };
}

export type AppStore = ReturnType<typeof useAppState>;
```

- [ ] **Step 3: Gate the splash on loading**

`App.tsx`:

```tsx
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LifePlanApp } from './src/LifePlanApp';

SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <LifePlanApp />
    </SafeAreaProvider>
  );
}
```

`src/LifePlanApp.tsx` (the maintenance tab is wired in Task 5; here the hook is only loaded and the splash released):

```tsx
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from './components/common/AppHeader';
import { TabBar, type TabItem } from './components/common/TabBar';
import { useAppState } from './hooks/useAppState';
import { colors } from './theme/colors';
import { typography } from './theme/typography';

type AppTab = 'week' | 'shopping' | 'maintenance';

const tabs: TabItem<AppTab>[] = [
  { id: 'week', icon: 'calendar-outline', label: 'Semana' },
  { id: 'shopping', icon: 'cart-outline', label: 'Compras' },
  { id: 'maintenance', icon: 'settings-outline', label: 'Manutenção' },
];

export function LifePlanApp() {
  const insets = useSafeAreaInsets();
  const store = useAppState();
  const [activeTab, setActiveTab] = useState<AppTab>('week');
  const { isLoaded } = store;

  useEffect(() => {
    if (isLoaded) SplashScreen.hideAsync();
  }, [isLoaded]);

  if (!isLoaded) return null;

  const activeLabel = tabs.find((tab) => tab.id === activeTab)?.label;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 10, paddingBottom: insets.bottom },
      ]}
    >
      <AppHeader />
      {store.saveError ? <Text style={styles.error}>{store.saveError}</Text> : null}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{activeLabel}</Text>
      </View>
      <TabBar activeTab={activeTab} onChangeTab={setActiveTab} tabs={tabs} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: colors.textSecondary,
    ...typography.sectionTitle,
  },
  error: {
    color: colors.negative,
    paddingHorizontal: 20,
    paddingBottom: 8,
    ...typography.bodySmall,
  },
});
```

- [ ] **Step 4: Validate**

Run: `npm run fix && npm run check`
Expected: green. If Knip flags unused returned members, they are consumed in Task 5; otherwise investigate.
Run: `npx expo export --platform android`
Expected: bundles.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src App.tsx
git commit -m "feat: persist app state and release splash after loading"
```

---

### Task 5: Manutenção tab (houses and data)

**Files:**
- Create: `src/components/common/IconName.ts`, `src/components/common/SectionCard.tsx`, `src/components/common/ActionButton.tsx`, `src/components/common/IconButton.tsx`, `src/components/common/confirmAction.ts`, `src/components/maintenance/HousesSection.tsx`, `src/components/maintenance/DataSection.tsx`, `src/components/maintenance/MaintenanceScreen.tsx`, `src/services/sha256.ts`, `src/services/backupFiles.ts`
- Modify: `src/components/common/TabBar.tsx` (import shared `IconName`), `src/LifePlanApp.tsx`, `app.json`, `package.json` (via install)

**Interfaces:**
- Consumes: `AppStore` from `useAppState.ts`; `House`; `DeleteBlock`; `createBackupText`, `parseBackupText`, `backupFileName`, `Sha256` from `backup.ts`.
- Produces: `MaintenanceScreen({ store }: { store: AppStore })`; `confirmAction(title, message, confirmLabel): Promise<boolean>`; `sha256: Sha256`; `shareBackupFile(fileName: string, text: string): Promise<void>`; `pickBackupText(): Promise<string | null>`.

- [ ] **Step 1: Install and check the file APIs**

Run: `npx expo install expo-crypto expo-file-system expo-sharing expo-document-picker`
Run: `npx expo install --check`
Then open `node_modules/expo-file-system/build/*.d.ts` and confirm the `File` and `Paths` classes: `new File(Paths.cache, name)`, `file.create({ overwrite: true })`, `file.write(text)`, `file.text()`. If the installed SDK 56 API differs, adapt Step 4 to the real signatures and ledger the change.

Add the `expo-sharing` plugin to `app.json` (`"plugins"` array, after the splash entry): `"expo-sharing"`.

- [ ] **Step 2: Shared building blocks**

`src/components/common/IconName.ts`:

```ts
import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];
```

In `src/components/common/TabBar.tsx`, remove the local `IconName` type and the `ComponentProps` import, and add `import type { IconName } from './IconName';`.

`src/components/common/SectionCard.tsx`:

```tsx
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type SectionCardProps = { title: string; children: ReactNode };

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
    padding: 12,
  },
  title: {
    color: colors.textPrimary,
    ...typography.sectionTitle,
  },
});
```

`src/components/common/ActionButton.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { IconName } from './IconName';

type ActionButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
};

export function ActionButton({
  icon,
  label,
  onPress,
  variant = 'default',
}: ActionButtonProps) {
  const color = variant === 'danger' ? colors.negative : colors.textPrimary;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Ionicons color={color} name={icon} size={20} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  label: {
    ...typography.cardTitle,
  },
});
```

`src/components/common/IconButton.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '../../theme/colors';
import type { IconName } from './IconName';

type IconButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
};

export function IconButton({
  icon,
  label,
  onPress,
  color = colors.textSecondary,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
    >
      <Ionicons color={color} name={icon} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
```

`src/components/common/confirmAction.ts`:

```ts
import { Alert } from 'react-native';

export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
```

- [ ] **Step 3: Services (hashing and files)**

`src/services/sha256.ts`:

```ts
import * as Crypto from 'expo-crypto';

import type { Sha256 } from '../lib/backup';

export const sha256: Sha256 = (text) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
```

`src/services/backupFiles.ts` (adjust to the real API verified in Step 1):

```ts
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function shareBackupFile(fileName: string, text: string) {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(text);
  await Sharing.shareAsync(file.uri, {
    dialogTitle: 'Salvar backup',
    mimeType: 'application/json',
  });
}

export async function pickBackupText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: '*/*',
  });
  if (result.canceled) return null;
  return new File(result.assets[0].uri).text();
}
```

- [ ] **Step 4: Maintenance components**

`src/components/maintenance/HousesSection.tsx`:

```tsx
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { House } from '../../lib/appState';
import type { DeleteBlock } from '../../lib/houses';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { confirmAction } from '../common/confirmAction';
import { IconButton } from '../common/IconButton';
import { SectionCard } from '../common/SectionCard';

type HousesSectionProps = {
  houses: House[];
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  getDeleteBlock: (id: string) => DeleteBlock | null;
};

const deleteMessages: Record<DeleteBlock, string> = {
  'has-items': 'Mova ou exclua os itens desta casa antes.',
  'last-house': 'É preciso manter ao menos uma casa.',
};

export function HousesSection({
  houses,
  onAdd,
  onRename,
  onDelete,
  getDeleteBlock,
}: HousesSectionProps) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleDelete(house: House) {
    const block = getDeleteBlock(house.id);
    if (block) {
      setMessage(deleteMessages[block]);
      return;
    }
    const confirmed = await confirmAction(
      'Excluir casa',
      `Excluir "${house.name}"?`,
      'Excluir',
    );
    if (!confirmed) return;
    setMessage(null);
    onDelete(house.id);
  }

  return (
    <SectionCard title="Casas">
      {houses.map((house) => (
        <HouseRow
          house={house}
          key={`${house.id}:${house.name}`}
          onDelete={() => handleDelete(house)}
          onRename={onRename}
        />
      ))}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <AddHouseRow onAdd={onAdd} />
    </SectionCard>
  );
}

function AddHouseRow({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.addRow}>
      <IconButton
        color={colors.accent}
        icon="add-circle-outline"
        label="Adicionar casa"
        onPress={onAdd}
      />
      <Text style={styles.addLabel}>Adicionar casa</Text>
    </View>
  );
}

type HouseRowProps = {
  house: House;
  onRename: (id: string, name: string) => void;
  onDelete: () => void;
};

function HouseRow({ house, onRename, onDelete }: HouseRowProps) {
  const [draft, setDraft] = useState(house.name);

  function commit() {
    if (draft.trim() === '') {
      setDraft(house.name);
      return;
    }
    onRename(house.id, draft);
  }

  return (
    <View style={styles.row}>
      <TextInput
        accessibilityLabel={`Nome da casa ${house.name}`}
        onChangeText={setDraft}
        onEndEditing={commit}
        style={styles.input}
        value={draft}
      />
      <IconButton
        icon="trash-outline"
        label={`Excluir ${house.name}`}
        onPress={onDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    color: colors.textPrimary,
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    ...typography.input,
  },
  message: {
    color: colors.negative,
    ...typography.bodySmall,
  },
  addRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  addLabel: {
    color: colors.accent,
    ...typography.button,
  },
});
```

`src/components/maintenance/DataSection.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ActionButton } from '../common/ActionButton';
import { SectionCard } from '../common/SectionCard';

export type DataStatus = { kind: 'success' | 'error'; text: string } | null;

type DataSectionProps = {
  status: DataStatus;
  onBackup: () => void;
  onRestore: () => void;
  onReset: () => void;
};

export function DataSection({ status, onBackup, onRestore, onReset }: DataSectionProps) {
  const isError = status?.kind === 'error';
  const statusColor = isError ? colors.negative : colors.positive;
  return (
    <SectionCard title="Dados">
      <ActionButton icon="share-outline" label="Fazer backup" onPress={onBackup} />
      <ActionButton
        icon="download-outline"
        label="Restaurar backup"
        onPress={onRestore}
      />
      <ActionButton
        icon="refresh-outline"
        label="Limpar tudo"
        onPress={onReset}
        variant="danger"
      />
      {status ? (
        <View style={styles.status}>
          <Ionicons
            color={statusColor}
            name={isError ? 'alert-circle' : 'checkmark-circle'}
            size={16}
          />
          <Text style={[styles.statusText, { color: statusColor }]}>{status.text}</Text>
        </View>
      ) : null}
      <Text style={styles.note}>Restaurar e limpar substituem os dados atuais.</Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  status: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statusText: {
    ...typography.bodySmall,
  },
  note: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
});
```

`src/components/maintenance/MaintenanceScreen.tsx`:

```tsx
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import type { AppStore } from '../../hooks/useAppState';
import { backupFileName, createBackupText, parseBackupText } from '../../lib/backup';
import { pickBackupText, shareBackupFile } from '../../services/backupFiles';
import { sha256 } from '../../services/sha256';
import { confirmAction } from '../common/confirmAction';
import { type DataStatus, DataSection } from './DataSection';
import { HousesSection } from './HousesSection';

export function MaintenanceScreen({ store }: { store: AppStore }) {
  const [status, setStatus] = useState<DataStatus>(null);

  async function handleBackup() {
    try {
      const now = new Date();
      const text = await createBackupText(store.state, now, sha256);
      await shareBackupFile(backupFileName(now), text);
      setStatus({ kind: 'success', text: 'Backup pronto para salvar.' });
    } catch {
      setStatus({ kind: 'error', text: 'Não foi possível criar o backup.' });
    }
  }

  async function handleRestore() {
    try {
      const text = await pickBackupText();
      if (text === null) return;
      const result = await parseBackupText(text, sha256);
      if (!result.ok) {
        setStatus({ kind: 'error', text: result.error });
        return;
      }
      const confirmed = await confirmAction(
        'Restaurar backup',
        'Os dados atuais serão substituídos.',
        'Restaurar',
      );
      if (!confirmed) return;
      store.replaceState(result.state);
      setStatus({ kind: 'success', text: 'Backup restaurado.' });
    } catch {
      setStatus({ kind: 'error', text: 'Não foi possível ler o arquivo.' });
    }
  }

  async function handleReset() {
    const confirmed = await confirmAction(
      'Limpar tudo',
      'Todos os dados serão apagados e o app volta ao estado inicial.',
      'Limpar',
    );
    if (!confirmed) return;
    store.resetState();
    setStatus({ kind: 'success', text: 'Dados apagados.' });
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <HousesSection
        getDeleteBlock={store.getDeleteBlock}
        houses={store.state.houses}
        onAdd={() => store.addHouse(`Casa ${store.state.houses.length + 1}`)}
        onDelete={store.deleteHouse}
        onRename={store.renameHouse}
      />
      <DataSection
        onBackup={handleBackup}
        onReset={handleReset}
        onRestore={handleRestore}
        status={status}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 12,
  },
});
```

- [ ] **Step 5: Wire the tab into `LifePlanApp`**

In `src/LifePlanApp.tsx` import `MaintenanceScreen` from `./components/maintenance/MaintenanceScreen` and replace the content block with:

```tsx
      <View style={styles.content}>
        {activeTab === 'maintenance' ? (
          <MaintenanceScreen store={store} />
        ) : (
          <Text style={styles.sectionTitle}>{activeLabel}</Text>
        )}
      </View>
```

- [ ] **Step 6: Static validation and standards review**

Run: `npm run fix && npm run check`
Run: `npm run dup`
Expected: green; duplication at or below 5%.
Walk the "Review checklist" in `docs/standards/react-native-standards.md`: no hard-coded colors outside `src/theme/`, no `any`, icon-only buttons have `accessibilityLabel`, touch targets at least 44 dp. Fix anything that fails.
Run: `npx expo export --platform android`
Expected: bundles.

- [ ] **Step 7: Manual check on the Android emulator**

Run: `npx expo run:android`
Expected, in order:
1. Cold start: splash stays until data loads, then the app appears. Kill and reopen: house names and counts persist.
2. `Manutenção` > `Casas`: rename a house (change survives restart); clear the text and leave the field (old name returns); `Adicionar casa` adds `Casa 3`; delete asks for confirmation; deleting until one house is left shows `É preciso manter ao menos uma casa.`
3. `Fazer backup` opens the share sheet with a `life-plan-backup-AAAA-MM-DD.lpb` file; save it somewhere.
4. Rename a house, then `Restaurar backup` with that file: confirmation appears, the original name returns, status says `Backup restaurado.`
5. Cancel the file picker: nothing changes, no message.
6. Pick a non-backup file (for example a photo or text file): the readable error appears and data is unchanged.
7. Open the `.lpb` in a text editor, change a house name, restore it: `Backup inválido: o conteúdo foi alterado ou está corrompido.`
8. `Limpar tudo` asks for confirmation and returns to `Casa 1` and `Casa 2`.

Record what was checked and what was not.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json app.json src
git commit -m "feat: add maintenance tab with houses, backup, restore and reset"
```

---

### Task 6: Documentation and final validation

**Files:**
- Modify: `README.md`, `docs/app-context.md`, `docs/quality/coverage-baseline.md`, `docs/standards/code-duplication-policy.md`

- [ ] **Step 1: Update `README.md`**

In "Current status", add under Implemented: houses management, backup/restore/reset in `Manutenção`, persistence of all data on the device. Remove those items from the Planned list. Add a "Local data" section:

```markdown
## Local data

All data lives on the device in one JSON document (AsyncStorage key `@life-plan-app/state/v1`). `Manutenção` > `Dados` exports a `life-plan-backup-AAAA-MM-DD.lpb` file (JSON with a SHA-256 integrity hash), restores one after validating it (altered or malformed files are rejected and current data is kept), and resets to two empty houses. The hash detects accidental or casual edits only; it is not tamper-proof.
```

- [ ] **Step 2: Update `docs/app-context.md`**

Update `## Status` to list houses management and backup/restore/reset as implemented and the weekly planner and shopping list as planned. Add a short "Data" paragraph: single JSON state document, free list of houses (at least one, default `Casa 1` and `Casa 2`), `.lpb` backup with integrity hash, atomic restore, reset.

- [ ] **Step 3: Record baselines**

Run `npm run test:coverage` and `npm run dup`; replace the baseline lines in `docs/quality/coverage-baseline.md` and `docs/standards/code-duplication-policy.md` with the new measured values and the date.

- [ ] **Step 4: Full gate**

Run: `npm run check` and `npm run dup`
Expected: all pass.

- [ ] **Step 5: Summarize**

Report files changed, validation executed (including the manual emulator results from Task 5), and pending items.

- [ ] **Step 6: Commit**

```bash
git add README.md docs
git commit -m "docs: document persistence, houses and backup"
```
