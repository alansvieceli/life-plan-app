# Plan 001 - Expo Bootstrap, Branding and Shell

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A runnable Android Expo app with tooling, theme, app icon, native splash, header with greeting, and an empty 3-tab shell.

**Architecture:** Plain Expo (managed) + TypeScript strict. Tabs are component state, no navigation library. Pure logic (greeting) lives in `src/lib/` with Jest tests; UI lives in `src/components/` and `src/LifePlanApp.tsx`. Patterns mirror `C:\projetos\app\cycle12-finance-app`.

**Tech Stack:** Expo SDK 56, React Native 0.85.3, React 19.2.3, TypeScript ~6.0.3, `@expo/vector-icons`, `expo-splash-screen`, `react-native-safe-area-context`, Biome, Knip, Jest (`jest-expo`).

**Spec:** `docs/specs/001-life-plan-app.md` (this is plan 1 of 4; plans 002 state/Manutenção, 003 Compras, 004 Semana come later).

## Global Constraints

- Android only; no backend, no authentication, no paid services, no unnecessary dependencies.
- TypeScript `strict`; Biome (single quotes, semicolons, trailing commas, line width 88, 2 spaces); Knip clean.
- UI copy in Brazilian Portuguese, sentence case; tab labels exactly `Semana`, `Compras`, `Manutenção`.
- Greeting: 05-11 `Bom dia`, 12-17 `Boa tarde`, otherwise `Boa noite`, followed by ` :)`.
- Colors: `background #F6F1E9`, `surface #FFFFFF`, `surfaceMuted #EEE7DA`, `border #E2D9C8`, `textPrimary #3B3A36`, `textSecondary #8A8578`, `accent #7C9A7E`, `accentText #FFFFFF`, `negative #C0705F`, `warning #D9A66B`, `info #6F93A8`.
- App name `Life Plan`, slug `life-plan-app`, Android package `br.com.lifeplan.app`, portrait, light UI.
- Splash: `expo-splash-screen` plugin, background `#F6F1E9`, `contain`, stays visible until the app is ready.
- `src/lib/` coverage above 80%; duplication at or below 5% (`npx jscpd src --min-tokens 50 --threshold 5`).
- Follow `docs/standards/react-native-standards.md` (structure, reuse, accessibility, theme tokens, no `any`).
- Quality gate for closing the spec work of this plan: `npm run check`.
- Commits: only when the user asks for them. This repo has no commits yet. Steps marked "Commit" are skipped unless requested.

## Review Focus

- Greeting at the hour edges (04, 05, 11, 12, 17, 18, 00, 23): covered by Task 2 tests.
- Splash never hides if the hide call is not reached: checked manually on the emulator in Task 4 (cold start must leave the splash).
- Gesture-navigation or tall status bar devices: header and tab bar must not sit under system bars; checked manually in Task 4 using insets top and bottom.
- Narrow screens (about 320 dp) and large font scale: the `Manutenção` tab label must stay on one line; `numberOfLines={1}` in Task 4, checked manually.
- Launcher icon under circle and squircle masks: glyph must not be clipped; glyph is drawn inside the adaptive safe zone in Task 3, checked manually.

---

### Task 1: Project scaffold and tooling

**Files:**
- Create: `package.json`, `index.ts`, `App.tsx`, `app.json`, `jest.config.js`
- Existing, keep untouched: `biome.json`, `knip.json`, `tsconfig.json`, `.editorconfig`, `.gitignore`

**Interfaces:**
- Produces: npm scripts `lint`, `format`, `format:check`, `typecheck`, `test`, `test:coverage`, `biome:ci`, `knip`, `knip:production`, `check`, `dup`, `start`, `android`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "life-plan-app",
  "version": "0.1.0",
  "main": "index.ts",
  "private": true,
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "lint": "biome lint . --error-on-warnings",
    "lint:fix": "biome lint --write .",
    "fix": "biome check --write .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "typecheck": "tsc --noEmit",
    "dup": "npx --yes jscpd src --min-tokens 50 --threshold 5",
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --runInBand",
    "biome:ci": "biome ci . --error-on-warnings",
    "knip": "knip --treat-config-hints-as-errors",
    "knip:production": "knip --production --strict --treat-config-hints-as-errors",
    "check": "npm run biome:ci && npm run typecheck && npm run test:coverage && npm run knip && npm run knip:production"
  },
  "dependencies": {
    "@expo/vector-icons": "^15.1.1",
    "expo": "~56.0.12",
    "expo-splash-screen": "~56.0.10",
    "expo-status-bar": "~56.0.4",
    "react": "19.2.3",
    "react-native": "0.85.3"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.5.3",
    "@types/jest": "29.5.14",
    "@types/react": "~19.2.2",
    "jest": "^29.7.0",
    "jest-expo": "~56.0.5",
    "knip": "^6.26.0",
    "typescript": "~6.0.3"
  }
}
```

- [ ] **Step 2: Create `index.ts`, a minimal `App.tsx`, `app.json`, `jest.config.js`**

`index.ts`:

```ts
import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
```

`App.tsx` (temporary, replaced in Task 4):

```tsx
import { Text } from 'react-native';

export default function App() {
  return <Text>Life Plan</Text>;
}
```

`app.json`:

```json
{
  "expo": {
    "name": "Life Plan",
    "slug": "life-plan-app",
    "version": "0.1.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "android": {
      "predictiveBackGestureEnabled": false,
      "softwareKeyboardLayoutMode": "resize",
      "package": "br.com.lifeplan.app"
    }
  }
}
```

`jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/?(*.)+(test).[tj]s?(x)'],
  collectCoverageFrom: ['src/lib/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
```

- [ ] **Step 3: Install and align Expo versions**

Run: `npm install`
Run: `npx expo install react-native-safe-area-context`
Run: `npx expo install --check`
Expected: install succeeds; the check reports dependencies are up to date (accept its fixes if it proposes any).

- [ ] **Step 4: Verify the toolchain**

Run: `npm run biome:ci`
Run: `npm run typecheck`
Expected: both pass. If `tsc` complains that `jest.setup.ts` listed in `tsconfig.json` `include` does not exist, that is only a warning-free glob entry and is fine; leave `tsconfig.json` as is.
Run: `npm run knip`
Expected: no findings. If Knip reports a config hint or an unresolved Expo plugin, fix it in `knip.json` and note the reason in the commit or task summary.

- [ ] **Step 5: Commit (only if requested)**

```bash
git add package.json package-lock.json index.ts App.tsx app.json jest.config.js
git commit -m "chore: bootstrap Expo project and tooling"
```

---

### Task 2: Greeting logic (TDD)

**Files:**
- Create: `src/lib/greeting.ts`
- Test: `src/lib/greeting.test.ts`

**Interfaces:**
- Produces: `greetingForHour(hour: number): 'Bom dia' | 'Boa tarde' | 'Boa noite'` and `greetingText(now?: Date): string` (returns for example `Bom dia :)`).

- [ ] **Step 1: Write the failing test**

`src/lib/greeting.test.ts`:

```ts
import { greetingForHour, greetingText } from './greeting';

describe('greetingForHour', () => {
  it.each([
    [0, 'Boa noite'],
    [4, 'Boa noite'],
    [5, 'Bom dia'],
    [11, 'Bom dia'],
    [12, 'Boa tarde'],
    [17, 'Boa tarde'],
    [18, 'Boa noite'],
    [23, 'Boa noite'],
  ])('hour %i -> %s', (hour, expected) => {
    expect(greetingForHour(hour)).toBe(expected);
  });
});

describe('greetingText', () => {
  it('appends the smiley to the greeting of the given date', () => {
    expect(greetingText(new Date(2026, 9, 6, 8, 30))).toBe('Bom dia :)');
    expect(greetingText(new Date(2026, 9, 6, 14, 0))).toBe('Boa tarde :)');
    expect(greetingText(new Date(2026, 9, 6, 21, 0))).toBe('Boa noite :)');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/lib/greeting.test.ts`
Expected: FAIL, "Cannot find module './greeting'".

- [ ] **Step 3: Write the implementation**

`src/lib/greeting.ts`:

```ts
export function greetingForHour(hour: number) {
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function greetingText(now: Date = new Date()) {
  return `${greetingForHour(now.getHours())} :)`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/lib/greeting.test.ts`
Expected: PASS (9 tests).
Run: `npm run test:coverage`
Expected: PASS with `src/lib/greeting.ts` at 100%.

- [ ] **Step 5: Commit (only if requested)**

```bash
git add src/lib/greeting.ts src/lib/greeting.test.ts
git commit -m "feat: add time-based greeting"
```

---

### Task 3: App icon, splash image and Expo branding config

**Files:**
- Create: `assets/app-icon.png`, `assets/adaptive-icon-foreground.png`, `assets/splash-logo.png`, `assets/favicon.png`
- Modify: `app.json`
- Throwaway (outside the repo, never committed): `<tmp>/lp-assets/make-assets.js`

**Interfaces:**
- Produces: `assets/app-icon.png` (1024x1024, paper background, sage glyph; also used by the header in Task 4); `app.json` icon, adaptive icon and splash plugin entries.

- [ ] **Step 1: Prepare a temp folder outside the repo and install `sharp` there**

Run (use the session scratchpad directory or any temp directory):

```bash
mkdir -p "$TMP/lp-assets" && cd "$TMP/lp-assets" && npm init -y && npm install sharp
```

Expected: `sharp` installs. The repo `package.json` is not touched.

- [ ] **Step 2: Create `make-assets.js` in that temp folder**

```js
const sharp = require('sharp');
const path = require('node:path');

const out = process.argv[2];
const SAGE = '#7C9A7E';
const PAPER = '#F6F1E9';

// Calendar page with binder rings and a check mark, scaled to sit inside the
// Android adaptive-icon safe zone.
const glyph = `
<g transform="translate(512 512) scale(0.85) translate(-512 -505)"
   fill="none" stroke="${SAGE}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round">
  <rect x="272" y="320" width="480" height="440" rx="72"/>
  <line x1="272" y1="450" x2="752" y2="450"/>
  <line x1="396" y1="250" x2="396" y2="350"/>
  <line x1="628" y1="250" x2="628" y2="350"/>
  <path d="M404 610 L484 690 L630 530" stroke-width="44"/>
</g>`;

const svg = (background) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${background}${glyph}</svg>`,
  );

const paper = `<rect width="1024" height="1024" fill="${PAPER}"/>`;

async function write(name, source, size) {
  await sharp(source).resize(size, size).png().toFile(path.join(out, name));
}

(async () => {
  await write('app-icon.png', svg(paper), 1024);
  await write('adaptive-icon-foreground.png', svg(''), 1024);
  await write('splash-logo.png', svg(''), 1024);
  await write('favicon.png', svg(paper), 48);
})();
```

- [ ] **Step 3: Generate the assets into the repo**

Run: `mkdir -p assets && node "$TMP/lp-assets/make-assets.js" "<repo>/assets"` (replace `<repo>` with the project root).
Expected: four PNG files in `assets/`.

- [ ] **Step 4: Look at the images**

Open `assets/app-icon.png` and `assets/adaptive-icon-foreground.png` with the Read tool.
Expected: sage calendar glyph with check mark; centered; transparent background in the foreground file; nothing near the edges. If the glyph looks off, adjust the SVG numbers in the temp script and regenerate.

- [ ] **Step 5: Wire branding into `app.json`**

Replace `app.json` with:

```json
{
  "expo": {
    "name": "Life Plan",
    "slug": "life-plan-app",
    "version": "0.1.0",
    "orientation": "portrait",
    "icon": "./assets/app-icon.png",
    "userInterfaceStyle": "light",
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#F6F1E9",
        "foregroundImage": "./assets/adaptive-icon-foreground.png"
      },
      "predictiveBackGestureEnabled": false,
      "softwareKeyboardLayoutMode": "resize",
      "package": "br.com.lifeplan.app"
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "image": "./assets/splash-logo.png",
          "backgroundColor": "#F6F1E9",
          "resizeMode": "contain",
          "imageWidth": 180
        }
      ]
    ]
  }
}
```

- [ ] **Step 6: Verify config**

Run: `npx expo config --type public`
Expected: prints the config without errors; icon and splash paths resolve.
Run: `npm run biome:ci`
Expected: PASS.

- [ ] **Step 7: Commit (only if requested)**

```bash
git add assets app.json
git commit -m "feat: add app icon, splash and branding config"
```

---

### Task 4: Theme, TabBar, header, shell and splash handling

**Files:**
- Create: `src/theme/colors.ts`, `src/theme/typography.ts`, `src/components/common/TabBar.tsx`, `src/components/common/AppHeader.tsx`, `src/LifePlanApp.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Consumes: `greetingText` from `src/lib/greeting.ts`; `assets/app-icon.png`.
- Produces: `colors`, `typography`, `TabBar<T>` with `TabItem<T> = { id: T; icon: Ionicons name; label: string }`, `AppHeader`, `LifePlanApp`.

- [ ] **Step 1: Create the theme**

`src/theme/colors.ts`:

```ts
export const colors = {
  background: '#F6F1E9',
  surface: '#FFFFFF',
  surfaceMuted: '#EEE7DA',
  border: '#E2D9C8',
  textPrimary: '#3B3A36',
  textSecondary: '#8A8578',
  accent: '#7C9A7E',
  accentText: '#FFFFFF',
  positive: '#7C9A7E',
  negative: '#C0705F',
  warning: '#D9A66B',
  info: '#6F93A8',
};
```

`src/theme/typography.ts`:

```ts
const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '700',
  bold: '800',
} as const;

const serif = 'serif';

export const typography = {
  screenTitle: {
    fontFamily: serif,
    fontSize: 24,
    fontWeight: fontWeights.semibold,
    lineHeight: 30,
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: fontWeights.semibold,
    lineHeight: 24,
  },
  cardTitle: { fontSize: 16, fontWeight: fontWeights.semibold, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: fontWeights.medium, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: fontWeights.medium, lineHeight: 17 },
  label: { fontSize: 11, fontWeight: fontWeights.bold, lineHeight: 15 },
  button: { fontSize: 13, fontWeight: fontWeights.semibold, lineHeight: 18 },
  tab: { fontSize: 12, fontWeight: fontWeights.semibold, lineHeight: 16 },
  input: { fontSize: 16, fontWeight: fontWeights.medium, lineHeight: 22 },
} as const;
```

- [ ] **Step 2: Create `TabBar`**

`src/components/common/TabBar.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type TabItem<T extends string> = {
  id: T;
  icon: IconName;
  label: string;
};

type TabBarProps<T extends string> = {
  activeTab: T;
  onChangeTab: (tab: T) => void;
  tabs: TabItem<T>[];
};

export function TabBar<T extends string>({
  activeTab,
  onChangeTab,
  tabs,
}: TabBarProps<T>) {
  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const color = isActive ? colors.accentText : colors.textSecondary;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              key={tab.id}
              onPress={() => onChangeTab(tab.id)}
              style={[styles.tab, isActive ? styles.tabActive : null]}
            >
              <Ionicons color={color} name={tab.icon} size={20} />
              <Text numberOfLines={1} style={[styles.label, { color }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  bar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    padding: 5,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    gap: 1,
    paddingVertical: 6,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  label: {
    ...typography.tab,
  },
});
```

- [ ] **Step 3: Create `AppHeader`**

`src/components/common/AppHeader.tsx`:

```tsx
import { Image, StyleSheet, Text, View } from 'react-native';

import { greetingText } from '../../lib/greeting';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export function AppHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Image
          accessibilityIgnoresInvertColors
          accessible={false}
          source={require('../../../assets/app-icon.png')}
          style={styles.icon}
        />
        <Text style={styles.brandName}>Life Plan</Text>
      </View>
      <Text style={styles.greeting}>{greetingText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  icon: {
    borderRadius: 10,
    height: 36,
    width: 36,
  },
  brandName: {
    color: colors.textPrimary,
    ...typography.sectionTitle,
  },
  greeting: {
    color: colors.textPrimary,
    ...typography.screenTitle,
  },
});
```

- [ ] **Step 4: Create the shell**

`src/LifePlanApp.tsx`:

```tsx
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from './components/common/AppHeader';
import { type TabItem, TabBar } from './components/common/TabBar';
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
  const [activeTab, setActiveTab] = useState<AppTab>('week');
  const activeLabel = tabs.find((tab) => tab.id === activeTab)?.label;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 10, paddingBottom: insets.bottom },
      ]}
    >
      <AppHeader />
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
});
```

Note: the tab content area is a placeholder; plans 002, 003 and 004 replace it with the real screens.

- [ ] **Step 5: Replace `App.tsx` with splash handling**

```tsx
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LifePlanApp } from './src/LifePlanApp';

SplashScreen.preventAutoHideAsync();

export default function App() {
  // Plan 002 will hide the splash only after the saved state has loaded.
  return (
    <SafeAreaProvider onLayout={() => SplashScreen.hideAsync()}>
      <StatusBar style="dark" />
      <LifePlanApp />
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 6: Static validation**

Run: `npm run fix` (lets Biome sort imports and format), then `npm run biome:ci`
Run: `npm run typecheck`
Run: `npm run knip` and `npm run knip:production`
Expected: all pass. If Knip flags an unused export or file, remove it rather than silencing Knip.

- [ ] **Step 6b: Standards review**

Walk the "Review checklist" in `docs/standards/react-native-standards.md` over the new files. Expected: no hard-coded colors outside `src/theme/`, no `any`, tab buttons at least 44 dp tall (icon 20 + label 16 + padding), decorative header icon hidden from screen readers (`accessible={false}` on the `Image` in `AppHeader`). Fix anything that fails.

- [ ] **Step 7: Bundle check**

Run: `npx expo export --platform android`
Expected: bundling finishes without errors. (`dist/` is gitignored.)

- [ ] **Step 8: Manual check on the Android emulator**

Run: `npx expo run:android` (first run generates the gitignored `android/` folder; an emulator must be running).
Expected, in order:
1. Cold start shows the paper-colored splash with the sage glyph, then the app (splash leaves; it is not stuck).
2. Header shows the small icon, `Life Plan` in serif, and the greeting for the current hour (compare with the phone clock).
3. The three tabs switch; the active one is filled sage; `Manutenção` stays on one line.
4. Header is not under the status bar and the tab bar is not under the gesture bar. Repeat on a narrow device profile and with large font size if available.
5. Launcher shows the `Life Plan` name and icon; the glyph is not clipped under the launcher mask.

Record what was checked (and anything not checked) in the task summary.

- [ ] **Step 9: Commit (only if requested)**

```bash
git add App.tsx src
git commit -m "feat: add themed shell with header, tabs and splash"
```

---

### Task 5: Documentation and final validation

**Files:**
- Create: `README.md`
- Modify: `docs/app-context.md`, `docs/quality/coverage-baseline.md`, `docs/standards/code-duplication-policy.md`

- [ ] **Step 1: Create `README.md`**

````markdown
# Life Plan

Personal Android app (React Native, Expo, TypeScript) to organize the week and keep a shopping list split across houses. Single user, offline-first: all data stays on the device.

## Current status

Implemented:

- Themed app shell (paper tones, sage green, serif titles) with header, time-based greeting and three tabs: `Semana`, `Compras`, `Manutenção`.
- App icon and native splash screen.

Planned (see `docs/specs/001-life-plan-app.md`): weekly planner with recurring and one-off activities, shopping list by house, house management, backup/restore/reset of local data. The three tabs are placeholders until those plans are executed.

## Requirements

- Node.js 24 and npm
- Android Studio with an emulator (Android only)

## Install and run

```bash
npm install
npm run android
```

`npm start` starts the Expo dev server only.

## Validation

```bash
npm run check
```

Runs Biome, TypeScript, Jest with coverage, and Knip. Related commands: `npm run lint`, `npm run format`, `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run dup`.

## Project structure

- `src/lib/` pure, tested logic
- `src/components/` UI components
- `src/theme/` colors and typography
- `docs/` standards, specs, plans and app context

## Workflow

Spec first, plan second, tasks third. See `AGENTS.md` and `docs/standards/`.
````

- [ ] **Step 2: Update `docs/app-context.md`**

Replace the `## Status` section with:

```markdown
## Status

Implemented: themed app shell with header (app icon, greeting), three tabs (`Semana`, `Compras`, `Manutenção`) with placeholder content, app icon, and native splash. The planner, shopping list and maintenance features below are still planned (spec `docs/specs/001-life-plan-app.md`).
```

- [ ] **Step 3: Record baselines**

Run: `npm run test:coverage` and `npm run dup`. In `docs/quality/coverage-baseline.md` replace the "No baseline recorded yet" paragraph with the measured `src/lib/` numbers and the date. In `docs/standards/code-duplication-policy.md` replace the "Current Baseline" text with the measured percentage and the date.

- [ ] **Step 4: Full quality gate**

Run: `npm run check`
Run: `npm run dup`
Expected: all pass; duplication at or below 5%; `src/lib/` coverage above 80%.

- [ ] **Step 5: Summarize**

Report: files changed, validation executed (including the manual emulator check from Task 4), pending items (`husky`/commit hooks and the cycle12 Android centered-splash plugin were intentionally not copied; add only if needed).

- [ ] **Step 6: Commit (only if requested)**

```bash
git add README.md docs
git commit -m "docs: add README and record quality baselines"
```
