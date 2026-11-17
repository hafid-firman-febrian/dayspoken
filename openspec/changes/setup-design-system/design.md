# Design

## Context

See `proposal.md` for the motivation. Requirements are in `specs/design-tokens/`, `specs/theme-mode/`, `specs/base-ui-components/`, and `specs/component-gallery/`.

**Repository (observed 2026-11-17, `main` at `373a5d3`):**
- Expo SDK 58 (`expo` 58.0.25), React Native 0.88.1, React 19.3.0, TypeScript ~6.0.3, Expo Router 58, Node 22.
- `app/_layout.tsx` is a bare `Stack` with no providers. `app/index.tsx` is a placeholder that uses `StyleSheet` and no colors. It has a route test in `__tests__/app/index.test.tsx`.
- No `babel.config.js` or `metro.config.js`; the Expo defaults are used.
- `app.json` has `userInterfaceStyle: "light"`, so the OS always reports light today.
- `eslint.config.js` has two structure rules: `process.env` only in `src/lib/env.ts`, and no deep feature imports (`no-restricted-imports` on `**/*`).
- `jest.config.js` uses the `jest-expo` preset with the `@/` mapper and no setup file.
- Not yet in `src/`: `src/theme/`, `src/ui/`, `src/utils/`.

**npm registry and docs (checked 2026-11-17):**

| Package | Version | Notes |
|---|---|---|
| `nativewind` | `latest` 4.2.7, `rc` 5.0.0-rc.1 | v4 uses Tailwind CSS v3 (`react-native-css-interop` 0.2.7). Its install page names Expo SDK 57. The v5 release plan says SDK 57 is tested and SDK 58 is being tested; no stable date |
| `tailwindcss` | `v3-lts` 3.4.19 | v4 is only for NativeWind v5 |
| `react-native-reanimated` / `react-native-worklets` | 4.7.1 / 0.13.0 | Versions bundled with SDK 58 |
| `react-native-gesture-handler` | ~3.3.0 | Bundled with SDK 58. Major version 3 |
| `@gorhom/bottom-sheet` | 5.2.14 | Peers: Gesture Handler `>=2.16.1`, Reanimated `>=3.16 \|\| >=4`. Its docs only name Gesture Handler v2 |
| `@expo/ui/community/bottom-sheet` | SDK 58 (~58.0.28) | Expo's drop-in replacement for `@gorhom/bottom-sheet`: native sheets, partial API |
| `react-native-svg` | 15.16.0 | Bundled with SDK 58 |
| `lucide-react-native` | 1.73.0 | Peer `react-native-svg` 12–15 |
| `react-native-mmkv` | 4.3.2 | Needs `react-native-nitro-modules` (0.37.2) |
| `@expo-google-fonts/geist` | 0.4.2 | Geist TTF files, weights 100–900 with italics. Package MIT, font OFL-1.1 |
| `expo-font`, `expo-splash-screen`, `expo-system-ui` | ~58.0.12, ~58.0.14, ~58.0.7 | Bundled with SDK 58 |
| `zustand` | 5.1.0 | Plain JavaScript |

**Palette contrast (WCAG, computed 2026-11-17):**

| Pair | Light | Dark |
|---|---|---|
| foreground on background / surface | 17.13 / 18.45 | 17.95 / 16.71 |
| muted on background / surface | 5.33 / 5.75 | 7.66 / 7.14 |
| accent on background / surface | **4.52** / 4.87 | 8.38 / 7.80 |
| on-primary on primary | 4.87 | 4.87 |
| on-fab on fab | 4.87 | 5.47 |
| Finish icon (white) on `#E8573C` | 3.58 | 3.58 |
| mood colors on light surfaces | 1.55–4.47 | n/a |

- Every text pair passes 4.5:1. Light accent on background passes with almost no margin (4.52).
- Every mood color fails 4.5:1 on light surfaces, and four of five fail 3:1. So mood colors are never text, and the label always carries the meaning (D4).
- `border` is 1.15–1.26 against its surfaces. It is decorative. Inputs are identified by their visible label, and focus uses `accent` (D12).

## Goals / Non-Goals

**Goals:**
- One token source drives NativeWind class names, values read in code (icon colors, sheet backgrounds, the navigation theme), and the tests.
- Dark mode, the manual override, and a forced dark subtree work everywhere, including portals and modals, with no light flash.
- The styling rules can be checked by machine: lint rejects hex colors, and a test rejects contrast regressions.
- The library behind each base component can be swapped without changing its callers: the gesture, sheet, and storage libraries stay inside `src/ui` and `src/lib`.

**Non-Goals:**
- No `dark:` variants in components. Semantic tokens switch values instead.
- No web styling or `react-native-web`.
- No snapshot or pixel tests. Tests check behavior and accessibility. Colors are checked where they are read in code (Icon, tokens).
- No custom theme beyond light and dark, and no per-user accent colors.

## Decisions

### D1. NativeWind v4.2.7 with Tailwind CSS v3, behind a compatibility spike

- **Choice:** `nativewind@4.2.7` and `tailwindcss@^3.4.17`. Reanimated and Worklets come from `npx expo install`.
- **Spike (first task group):** before any component is written, prove on the Android development build that:
  1. a token class (`bg-surface`) renders, and switches when the theme switches between light and dark through `vars()` (D3)
  2. the variables reach a React Native `Modal` rendered inside the provider
  3. `p-5` measures 20pt (D6)
  4. the TypeScript Tailwind config loads the token module (D2)
  5. `npm test` still passes with the new Babel config
- **If the spike fails:** stop and ask the owner. Options: NativeWind `5.0.0-rc.x` (Tailwind v4, `react-native-css`), or Uniwind. Class names in components stay the same in every option. Only `src/theme/` and the build config change.
- **Why v4:** it is the stable `latest`, it was updated on 2026-11-03, and the setup is documented. v5 is a release candidate whose SDK 58 testing is still in progress.
- **Alternative rejected:** `StyleSheet` with a typed theme hook. That is less to install, but the agreed stack and the class-name convention in `STRUCTURE.md` are NativeWind.

### D2. One token source in TypeScript

`src/theme/tokens.ts` is pure data with no imports from React Native, so Node can load it from the Tailwind config. It exports:

| Export | Contents |
|---|---|
| `colors.light`, `colors.dark` | The semantic colors per mode (spec `design-tokens`), with `scrim` as `rgba(...)` |
| `moodColors` | `mood-1` … `mood-5`, the same in both modes |
| `recordPalette` | `background`, `orbStops` (4), `finish`, `finishIcon`, `progress` |
| `typography` | Per style: font family, size, line height, letter spacing (D5) |
| `radius` | `card: 22`, `hero: 30` (pills use `rounded-full`) |
| `spacing` | `gutter: 20` (the rest is Tailwind's 4pt scale, D6) |

- **`src/theme/mood.ts`** exports `MOOD_SCALE`, which maps levels 1–5 to `{ label, colorToken }`, and the `MoodLevel` type (`1 | 2 | 3 | 4 | 5`).
- **`tailwind.config.ts`** imports `tokens.ts` by relative path. It maps every color name to `rgb(var(--color-<name>) / <alpha-value>)`, so opacity modifiers such as `bg-foreground/10` work. It also maps the font families, font sizes, `rounded-card`, `rounded-hero`, and `gutter`. The color names come from the keys of `colors.light`, so a new token gets a class automatically.
- **Settings:** `darkMode: 'class'` (NativeWind's requirement for manual selection), `presets: [require('nativewind/preset')]`, and `content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}']`.
- **`scrim`** is the only token with alpha. It is set as channel values plus a fixed alpha, so it is used as `bg-scrim` and needs no `/opacity` modifier.
- **Why:** hex values appear once, in one file. The Tailwind config, the CSS variables, `useTheme()` values, and the contrast test all read that file.
- **Alternatives rejected:**
  - CSS variables in `global.css` under `:root` and a dark block. Native code (icon colors, the system background, the Skia orb later) would need the same values again in TypeScript.
  - A `.js` token file. It loses types, and Tailwind v3 loads TypeScript configs.
- **Fallback:** if the TypeScript config fails in the spike, use `tailwind.config.js` with the class names written out, plus a test that compares them with the keys of `tokens.ts`.

### D3. Theme provider: `vars()` at the root, plus a React context

**`src/theme/ThemeProvider.tsx`:**
1. Resolves the scheme: `resolveScheme(mode, systemScheme)`, a pure function. It returns `mode` unless `mode` is `system`; then it returns the device scheme, or `light` when the device does not report one.
2. Renders a root `View` (`flex: 1`) with `style={vars(cssVariables[scheme])}`. `cssVariables` is built from `tokens.ts` as `--color-<name>: 'R G B'`.
3. Provides `ThemeContext` with `{ scheme, colors }` for code that needs raw values. `useTheme()` reads it.
4. Applies side effects when the scheme changes:
   - `expo-status-bar` style `light` in dark mode and `dark` in light mode
   - `SystemUI.setBackgroundColorAsync(colors.background)`, so no white shows behind transitions or the keyboard
   - the React Navigation theme (`ThemeProvider` with `DefaultTheme`/`DarkTheme` extended with background, card, text, border, and primary from the tokens), so navigator containers are never white
   - NativeWind's `colorScheme.set(mode)`, which also sets React Native's `Appearance` override, so native UI (keyboard, system alerts) matches

**`ThemeScope scheme="dark"`** (`src/theme/ThemeScope.tsx`) nests the same `vars()` view and context for a subtree. The Record screen uses it later. Values read in code follow it, because they come from the nearest context.

**Portals and modals:** the bottom-sheet provider, the toast host, and every `Modal` are rendered inside the root view, so they inherit the variables through React context. The spike checks this for `Modal` (D1).

**Alternative rejected:** `dark:` variants on every class. Twice the class names, easy to forget one, and it cannot force dark mode for a subtree.

### D4. Mood colors are indicators only

- Mood tokens are used as dot, ring, or fill colors. The label beside them uses `foreground` or `muted`.
- This change provides two things: the tokens with `MOOD_SCALE`, and Chip's `dot` prop. The feature components MoodChip, WeekMoodStrip, and MoodPicker come later and must use the label from `MOOD_SCALE`.
- **No `on-mood` text tokens:** text on a filled mood color would fail contrast for `mood-1` (4.13 with the foreground color).

### D5. Typography with Geist

- **Fonts:** `@expo-google-fonts/geist` in four weights: `Geist_400Regular`, `Geist_500Medium`, `Geist_600SemiBold`, and `Geist_700Bold`.
- **Loading:** `useFonts` in `app/_layout.tsx`.
  - `SplashScreen.preventAutoHideAsync()` runs at module scope.
  - `hideAsync()` runs once the fonts are loaded or have failed. Until then the layout renders `null`.
  - The files are bundled assets, so loading works offline.
- **One family per weight:** React Native needs a separate family name per weight for custom fonts, and Android falls back to the system font if `fontWeight` is set on a custom family. So Text sets only `fontFamily`, never `fontWeight`.
- **Tailwind families:** `font-geist`, `font-geist-medium`, `font-geist-semibold`, `font-geist-bold`. The `geist` prefix avoids a clash with Tailwind's weight classes (`font-medium`).
- **Styles** (in points; the line heights and letter spacing are filled in where the brief leaves them open):

| Style | Size | Family | Line height | Letter spacing | Max font scale |
|---|---|---|---|---|---|
| `display` | 38 | Bold | 42 | -1.0 | 1.4 |
| `title` | 27 | SemiBold | 32 | -0.5 | 1.4 |
| `heading` | 18 | SemiBold | 24 | -0.2 | none |
| `body` | 16 | Regular | 24 | 0 | none |
| `reading` | 17 | Regular | 27 (1.6) | 0 | none |
| `caption` | 13 | Medium | 18 | 0.1 | none |
| `caption-sm` | 12 | Medium | 16 | 0.2 | none |

- **Why the scale cap:** capping display and title at 1.4× keeps large headlines from breaking layouts, while body and reading text scale fully.
- **Alternative rejected:** the `expo-font` config plugin, which embeds the fonts at build time. Android names the family after the file and iOS after the PostScript name, so every family would need `Platform.select`. `useFonts` gives the same names on both platforms and in Jest.

### D6. Spacing, radius, and the rem size

- NativeWind v4 uses 14px as `rem` by default, which would make `p-4` 14pt. `metro.config.js` sets `withNativeWind(config, { input: './src/theme/global.css', inlineRem: 16 })`, so Tailwind's scale is the 4pt grid: `p-1` is 4, and `p-5` is 20. The spike measures this.
- `px-gutter` is the 20pt screen gutter. `rounded-card` is 22, `rounded-hero` is 30, and pills use `rounded-full`.

### D7. Theme-mode preference: Zustand with MMKV

- **Storage:** `src/lib/mmkv.ts` creates one MMKV instance (`createMMKV({ id: 'dayspoken' })`). It exports a small `{ getString, set, delete }` adapter. It is the only file that imports `react-native-mmkv`.
- **Store:** `src/theme/theme-mode-store.ts` is a Zustand store `{ mode, setMode }` with the `persist` middleware over that adapter. The key is `preferences.theme`.
- **Validation:** MMKV is synchronous, so the store hydrates before the first render (no light frame). A Zod schema validates the persisted value in `merge`. Anything other than `system | light | dark` becomes `system`.
- **Public API:** `useThemeMode()` returns `{ mode, setMode }`, exported from `@/theme`. The Settings theme row (`add-settings-account`) uses it.
- **Why Zustand:** `STRUCTURE.md` names Zustand as the home for preferences, and later preferences (for example the reminder UI state) can join the same pattern.
- **Alternative rejected:** React state in the provider with manual MMKV calls. That is one more pattern to learn, and other screens could not read the mode without the provider.

### D8. Base components

All components live in `src/ui/<Name>.tsx`, with a test next to each and a barrel `src/ui/index.ts`. Their behavior and accessibility are in spec `base-ui-components`. These are the implementation choices that matter:

| Component | Built on | Notes |
|---|---|---|
| Screen | `SafeAreaView` (safe-area-context), optional `ScrollView` | `bg-background`, `px-gutter`, default edges top, left, and right (the floating tab bar owns the bottom). `scroll` adds `keyboardShouldPersistTaps="handled"`, plus `KeyboardAvoidingView` on iOS |
| Text | RN `Text` | `variant` → classes from D5. `tone` defaults to the nearest `TextToneContext` (`foreground`, or `on-primary` inside a hero Card). `accessibilityRole="header"` for display, title, and heading |
| Button | `Pressable` | Variants primary, secondary, ghost; sizes md (52 high) and sm (40 high, `hitSlop` up to 44). `loading` replaces the leading icon with `ActivityIndicator` and sets `accessibilityState={{ busy: true, disabled: true }}`. Pressed: opacity 0.85 |
| IconButton | `Pressable` + Icon | `accessibilityLabel` is a required prop. Variants plain, surface, primary, fab, inverse. Sizes 44, and 56 for fab |
| Icon | `lucide-react-native` | `icon: LucideIcon`, `size` (default 20), `tone` (token name), `strokeWidth` 2. Color from `useTheme().colors`. Hidden from accessibility unless labeled |
| TextField | RN `TextInput`, or `BottomSheetTextInput` inside a sheet | A visible label is required. Focus outline `accent`. The error state uses the `accent` token with an alert icon, and the message is in a live region. Placeholder color is `muted` (5.33:1) |
| CodeInput | One hidden `TextInput` + `length` cells | `keyboardType="number-pad"`, `textContentType="oneTimeCode"`, `autoComplete="one-time-code"`. Input is filtered to digits and trimmed to `length`. `onComplete` fires once per completed value. The input carries the label and the value for accessibility |
| Card | `View`, or `Pressable` when `onPress` is set | Default `bg-surface rounded-card p-5`. Hero: `bg-primary rounded-hero` and provides `TextToneContext` `on-primary` |
| Chip | `Pressable` or `View` | Pill, at least 32 high with `hitSlop` up to 44. `dot` takes a color token. Selected: `bg-foreground`, `text-background` (mono inversion). `accessibilityState.selected` |
| BottomSheet | `BottomSheetModal` (`@gorhom/bottom-sheet`) | Controlled: `open` and `onClose`. Dynamic sizing, `BottomSheetBackdrop` with `pressBehavior="close"` on `scrim`, `surface` background with the `card` top radius, `border` handle. Keyboard `interactive` with `adjustResize`. Android back closes it through a `BackHandler` listener while open, which the library does not do itself. Provides a context so TextField switches its input |
| Dialog | RN `Modal` (`transparent`, fade, `statusBarTranslucent`) | `onRequestClose` = cancel. Confirm runs `onConfirm`. If it returns a promise, the Dialog shows loading and ignores cancel until it settles. `accessibilityViewIsModal`, and the title is announced |
| Toast | `ToastProvider` + `useToast()` | Queue of one visible toast, top-aligned below the safe area. 4s, or 6s with an action. Reanimated `FadeIn`/`FadeOut` (reduce-motion aware). `AccessibilityInfo.announceForAccessibility` |
| EmptyState, ErrorState | Icon + Text + Button | ErrorState defaults: "Something went wrong" and "Try again". `retrying` puts the button into loading. Live region `polite` |
| Banner | `View` | Tones neutral (surface, border, muted icon) and accent (accent icon and outline). Optional action (ghost Button, sm) and dismiss (IconButton "Dismiss"). Live region `polite` |
| Skeleton | Reanimated `View` | `bg-border`, shapes `text` (12 high, radius 6), `card` (radius 22), `pill`. Opacity pulse 1 → 0.5 over 1s, static when `useReducedMotion()` is true. Hidden from accessibility |
| SectionHeader | `View` + Text + optional ghost Button | `bg-background` (opaque, for sticky headers). Sizes `md` (heading) and `sm` (caption, muted) |

- **No danger color:** errors use `accent` with an icon and text. Destructive confirmations use the primary Button with a clear label. This keeps the UI neutral (proposal, "Details filled in").
- **Test helper:** `src/ui/test-utils.tsx` exports `renderWithProviders(ui, { scheme })`, which wraps a forced-scheme `ThemeScope`, `ToastProvider`, and the bottom-sheet provider. Each component test runs its main cases in `light` and `dark` with `describe.each`. The helper is not exported from `src/ui/index.ts`.

### D9. Which base components cover which screen state

Each later screen covers its states with these components, so no feature invents its own:

| State | Component |
|---|---|
| Empty | EmptyState |
| Loading | Skeleton (layout-shaped), or Button/ErrorState `loading` for actions |
| Error | ErrorState (whole screen or section), TextField/CodeInput error (fields), Toast (transient) |
| Offline | Banner (neutral, "You're offline") |
| Quota reached | Banner (accent), or EmptyState when the whole screen is blocked |

### D10. Root layout and provider order

`app/_layout.tsx`:

```
import '../src/theme/global.css'
SplashScreen.preventAutoHideAsync()

RootLayout
  useFonts(GEIST_FONTS) → null until loaded or failed, then hide the splash screen
  GestureHandlerRootView (flex 1)
    ThemeProvider              vars, context, status bar, system background, navigation theme
      BottomSheetModalProvider
        ToastProvider
          Stack (headerShown: false)
```

- Expo Router already provides `SafeAreaProvider`. If the spike shows otherwise, add it outside `ThemeProvider`.
- **`app.json`:**
  - `userInterfaceStyle: "automatic"`. Without it, the OS always reports light.
  - The `expo-splash-screen` plugin with `backgroundColor` `#F8F6F5` and `dark.backgroundColor` `#100A09`.
  - These two hex values cannot import TypeScript, so a test in `src/theme/tokens.test.ts` asserts that they equal `colors.light.background` and `colors.dark.background`.

### D11. Lint rules

Added to `eslint.config.js`:
1. **Hex colors:** `no-restricted-syntax` with the selector `Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]` for `app/**` and `src/**`, ignoring `src/theme/**`. Message: "Use a semantic token (bg-surface, text-muted, …) instead of a hex color." Tests outside `src/theme/` are covered too, so they compare against tokens.
2. **Library boundaries:** `@gorhom/bottom-sheet` and `react-native-mmkv` are allowed only in `src/ui/**` and `src/lib/mmkv.ts`.
3. **Base UI isolation:** `src/ui/**` may not import `@/features` or `@/features/*`.

**Caution:** ESLint flat config does not merge the options of one rule across blocks; a later block replaces them. Every block that sets `no-restricted-imports` therefore repeats the existing feature-import pattern. A probe file per rule proves each rule, the same way `setup-project-foundation` did.

### D12. Inputs without a strong border

`border` is decorative (1.2:1). Inputs stay identifiable by:
- a visible label (`foreground`)
- a `surface` fill on `background` (and the reverse inside sheets)
- a 2pt `accent` outline on focus and on error

The brief's contrast rule covers text, and all text passes. Non-text contrast for the resting outline (WCAG 1.4.11) relies on the label and fill instead of the border.

### D13. Development-only gallery

- **Route:** `app/dev/gallery.tsx` is thin. `if (!__DEV__) return <Redirect href="/" />`, else it renders `ComponentGallery` from `src/ui/gallery/`.
- **Content:** `src/ui/gallery/` holds one section file per group (tokens, typography, actions, inputs, feedback, overlays). It uses only base components and is not exported from `src/ui/index.ts`.
- **Placement:** `STRUCTURE.md` records `src/ui/gallery/` as the one place in `src/ui` that composes components into a screen. It belongs to the design system, holds no business logic, and fetches nothing.
- **Theme switch:** three Chips (System, Light, Dark) call the real `useThemeMode().setMode`, so the gallery also exercises persistence. A "Forced dark" Card sits inside `ThemeScope scheme="dark"`.
- **Placeholder home:** `app/index.tsx` uses `Screen` and `Text`, and in `__DEV__` shows a `Link` to `/dev/gallery`.
- **Tests:** `__tests__/app/dev/gallery.test.tsx` uses `expo-router/testing-library`'s `renderRouter` to check that:
  - every section title renders in development
  - with `__DEV__` set to `false`, `/dev/gallery` ends on `/`
- **Why not a separate dev app or Storybook:** Storybook for React Native adds a second entry point and many dependencies, while one route is enough here. The gallery code stays in the production bundle but cannot be reached. The size cost is small.

### D14. Jest setup for native libraries

`jest.setup.ts` is registered in `jest.config.js` (`setupFiles` for module mocks, `setupFilesAfterEnv` if a library's setup needs the test framework). Follow each library's Jest docs at apply time:
- Reanimated 4: its Jest setup (`setUpTests()`).
- Gesture Handler: `react-native-gesture-handler/jestSetup`.
- Bottom sheet: `jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'))`.
- MMKV: use the library's built-in Jest mock if v4 ships one; otherwise mock `@/lib/mmkv` with an in-memory `Map`.
- `react-native-svg`: if Lucide icons fail to render under `jest-expo`, add the community mock.

### D15. New dependencies

| Package | Why | Install | Cost |
|---|---|---|---|
| `nativewind` 4.2.7 | Class-name styling (agreed stack) | `npm i` | MIT, free |
| `tailwindcss` ^3.4.17 (dev) | NativeWind v4 compiler | `npm i -D` | MIT, free |
| `react-native-reanimated`, `react-native-worklets` | NativeWind animations, Skeleton, Toast, bottom sheet (agreed stack) | `npx expo install` | MIT, free |
| `react-native-gesture-handler` | Bottom-sheet gestures | `npx expo install` | MIT, free |
| `@gorhom/bottom-sheet` | BottomSheet (agreed stack) | `npm i` | MIT, free |
| `react-native-mmkv`, `react-native-nitro-modules` | Persisted preference (agreed stack) | `npm i` | MIT, free |
| `zustand` | Preference store (agreed stack) | `npm i` | MIT, free |
| `lucide-react-native`, `react-native-svg` | Icons (agreed stack) | `npm i` / `npx expo install` | ISC / MIT, free |
| `@expo-google-fonts/geist`, `expo-font` | Geist | `npx expo install` | MIT + OFL-1.1, free |
| `expo-splash-screen` | Hold the splash screen until fonts load; splash color per mode | `npx expo install` | MIT, free |
| `expo-system-ui` | Native root background color; needed for `userInterfaceStyle` on Android | `npx expo install` | MIT, free |
| `babel-preset-expo` (dev) | Explicit Babel config for NativeWind's `jsxImportSource` | `npx expo install -- --save-dev` | MIT, free |

- No new service.
- Native modules mean a rebuild with `npx expo run:android`.
- `npx expo-doctor` must pass after installs.

### D16. Commits

Conventional Commits on `feat/setup-design-system`, one per task group. Each group's `STRUCTURE.md` and `openspec/config.yaml` edits go in that group's commit, so there is no separate docs commit:
1. `docs(openspec): propose setup-design-system`
2. `chore: add NativeWind with Tailwind CSS`
3. `feat(theme): add Tomato design tokens`
4. `feat(theme): add theme mode with system default and override`
5. `feat(theme): load Geist fonts`
6. `feat(ui): add layout, text, and action components`
7. `feat(ui): add text field and code input`
8. `feat(ui): add feedback and overlay components`
9. `feat(ui): add dev-only component gallery`
10. `docs: tick Applied for setup-design-system`

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| NativeWind v4 does not work on SDK 58 / React Native 0.88 (its docs name SDK 57) | The spike (D1) runs before any component. On failure, stop and ask the owner: v5 RC or Uniwind. Component class names do not change |
| `@gorhom/bottom-sheet` 5.2.14 does not work with Gesture Handler 3.3 (its docs name v2) | Check the sheet on the device as soon as BottomSheet exists. If it fails, stop and ask the owner. The fallback is `@expo/ui/community/bottom-sheet`, Expo's drop-in with the same imports, behind the same `src/ui/BottomSheet` API. It has no custom backdrop, so the native scrim replaces `scrim` |
| `vars()` does not reach portals or `Modal` | The spike checks `Modal`. The bottom-sheet provider and toast host sit inside the root view. If `Modal` loses the variables, Dialog wraps its content in `ThemeScope` with the current scheme |
| NativeWind's `className` is not compiled under Jest, so styles are empty in tests | Tests check behavior and accessibility. Colors are checked where code reads them (Icon, `useTheme`) and in the token tests |
| Light `accent` on `background` is 4.52:1, almost at the limit | The contrast test fails on any change that drops it below 4.5 |
| Mood colors read as text would fail contrast | D4: indicators only. Labels use `foreground` or `muted`. The spec requires the label |
| Android ignores `fontWeight` with custom fonts, or falls back to Roboto | Text sets only `fontFamily` per weight (D5). Check on the device in the gallery |
| A manual override changes `Appearance` app-wide, so "system" must be restored correctly | `colorScheme.set('system')` clears the override. A test covers dark → system → device appearance |
| MMKV v4 or Nitro needs a native rebuild that fails locally | Run `npx expo-doctor`, then rebuild with `npx expo run:android`. Nitro needs no extra setup in a development build |
| The gallery ships in production code | It redirects to home when `__DEV__` is false, and the link is hidden. The bundle cost is small |
| `app.json` splash colors drift from the tokens | A token test compares them |

**Rollback:**
- Before the merge, close the PR and delete the branch.
- After the merge, `git revert -m 1 <merge-commit>`, then rebuild the development build, because native modules are removed.

## Free-tier facts to verify

- **No new service, so no quotas.** Every dependency is open source (D15).
- **Licenses (checked 2026-11-17 on npm):**
  - `@expo-google-fonts/geist` is "MIT AND OFL-1.1". The OFL allows bundling the font in an app.
  - Check the Lucide license (ISC) on its repository before the release README credits it (`prepare-portfolio-release`).
- **Compatibility to recheck at apply (it may have changed):**
  - NativeWind's `latest` tag and its SDK note
  - whether `@gorhom/bottom-sheet` names Gesture Handler 3
