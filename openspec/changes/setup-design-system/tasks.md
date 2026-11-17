# Tasks

**How to work through these tasks:**
- Talk to the owner in Bahasa Indonesia. Before every `git` command and every browser step on GitHub, say in plain Indonesian what it does. The agent runs local `git`; the owner does the GitHub steps in the browser.
- Each group ends with its own commit (design D16). That commit includes the `tasks.md` checkboxes ticked so far.
- Check the staged files (`git diff --cached --name-only`) before every commit.
- Install Expo-related packages with `npx expo install`, so versions match SDK 58. After installing native modules, run `npx expo-doctor` and rebuild the development build with `npx expo run:android` (set `ANDROID_HOME=$HOME/Library/Android/sdk` for the session).
- If a gate in group 2 or task 8.6 fails, stop and ask the owner before choosing a fallback (design D1, Risks).

## 1. Branch and change artifacts

- [x] 1.1 Run `git switch main && git pull`, then `git switch -c feat/setup-design-system`. Verify: `git branch --show-current` prints `feat/setup-design-system`, and `git status --short` lists only `openspec/changes/setup-design-system/`.
- [x] 1.2 In `ROADMAP.md`, tick Proposed and Reviewed for entry 2. The owner's apply request is the review approval; if that is unclear, ask first. Verify: `git diff ROADMAP.md` shows only those two ticks.
- [x] 1.3 Commit `openspec/changes/setup-design-system/` and `ROADMAP.md` as `docs(openspec): propose setup-design-system`. Verify: `git show --stat HEAD` lists only those paths.

## 2. NativeWind compatibility spike (gate)

- [x] 2.1 Recheck `npm view nativewind dist-tags` and the NativeWind install page. If `latest` is still 4.x, install it (design D1, D15):
  - `npm i nativewind@<latest 4.x>` and `npm i -D tailwindcss@^3.4.17`
  - `npx expo install react-native-reanimated react-native-worklets expo-system-ui`
  - `npx expo install babel-preset-expo -- --save-dev`

  Verify: `npx expo-doctor` reports no failed checks, and `npm ls nativewind tailwindcss react-native-reanimated` shows no peer errors.
- [x] 2.2 Add the build config:
  - `babel.config.js` with `babel-preset-expo` (`jsxImportSource: 'nativewind'`) and `nativewind/babel`
  - `metro.config.js` with `withNativeWind(config, { input: './src/theme/global.css', inlineRem: 16 })`
  - `src/theme/global.css` with the three `@tailwind` directives
  - `nativewind-env.d.ts`
  - a first `src/theme/tokens.ts` with only light/dark `background` and `surface`
  - `tailwind.config.ts`, which imports it (design D2)

  Set `userInterfaceStyle` to `"automatic"` in `app.json`. Verify: `npm run typecheck`, `npm run lint`, and `npm test` all pass with the new Babel config.
- [x] 2.3 Add a temporary probe to `app/index.tsx`:
  - a root `View` with `vars()` for the light or dark values, and a button that toggles between them
  - a `bg-surface p-5` box
  - a button that opens a React Native `Modal` holding another `bg-surface` box

  Rebuild with `npx expo run:android`. Verify on the device:
  - the box changes color when toggled
  - the `Modal` box changes too
  - the box's padding measures 20pt (for example with the element inspector)
  - no red-screen errors

  **Gate:** if any check fails, stop and ask the owner (NativeWind v5 RC or Uniwind, design D1).
- [x] 2.4 Remove the probe, so `app/index.tsx` is back to the placeholder. Verify: `git diff app/index.tsx` is empty, and `npm test` passes.
- [x] 2.5 Commit `chore: add NativeWind with Tailwind CSS`. Verify: `git status --short` is clean.

## 3. Design tokens

- [x] 3.1 Write `src/theme/contrast.test.ts` for a pure `contrastRatio(a, b)`: black on white is 21, white on white is 1, and `#6E6460` on `#F8F6F5` is about 5.33. Then implement `src/theme/contrast.ts`. Verify: the tests fail before the module exists and pass after.
- [x] 3.2 Complete `src/theme/tokens.ts` (design D2): `colors.light` and `colors.dark` with every semantic token including `fab`, `on-fab`, and `scrim`; `moodColors`; `recordPalette`; `typography` (D5 table); `radius`; `spacing`. Add `src/theme/mood.ts` with `MOOD_SCALE` and `MoodLevel`. Verify: `npm run typecheck` passes.
- [x] 3.3 Write `src/theme/tokens.test.ts` for the `design-tokens` spec:
  - the exact light and dark values
  - mood levels 1–5 with their labels, the same in both modes
  - the Record palette, including gradient order
  - every text pair at 4.5:1 or more and every icon pair at 3:1 or more, in both modes; the failure message names the pair and its ratio

  Verify: `npm test` passes. Temporarily setting light `muted` to `#A8A29E` makes it fail with that pair named; undo that afterwards.
- [x] 3.4 Finish `tailwind.config.ts`: color names from the keys of `colors.light` as `rgb(var(--color-<name>) / <alpha-value>)` plus the mood and Record colors, the `font-geist*` families, the font sizes per style, `rounded-card`, `rounded-hero`, `gutter`, `darkMode: 'class'`, and the NativeWind preset. Add `src/theme/css-variables.ts`, which builds the `--color-*` channel values per mode from `tokens.ts`, with a unit test (for example light `background` → `'248 246 245'`). Verify: `npm test` and `npm run typecheck` pass.
- [x] 3.5 Add the hex-color lint rule (design D11.1). Verify with temporary probe files:
  - `'#CC3F27'` in `app/` and in `src/ui/` each make `npm run lint` fail with the token message.
  - The same literal in `src/theme/` passes.

  Delete the probes. Then `npm run lint` exits 0.
- [x] 3.6 Update the docs for where tokens live:
  - `STRUCTURE.md`, Styling and theming: `src/theme/tokens.ts` is the source of the values, the class names and the `gutter`/`rounded-card`/`rounded-hero` utilities, mood colors as indicators only, and the hex rule now enforced by lint.
  - `openspec/config.yaml` `context`: the line "The token values are in ROADMAP.md (setup-design-system)" now points to `src/theme/tokens.ts`.

  Verify: `git diff STRUCTURE.md openspec/config.yaml` touches only those points, and `openspec instructions proposal --change setup-design-system --json` shows the new context line.
- [x] 3.7 Commit `feat(theme): add Tomato design tokens`. Verify: `git status --short` is clean.

## 4. Theme mode

- [x] 4.1 Install `react-native-mmkv` and `react-native-nitro-modules` with `npm i`, and `zustand`. Add `src/lib/mmkv.ts` (design D7). Add the lint rule that allows `react-native-mmkv` only there (design D11.2), repeating the existing feature-import pattern in every block that sets `no-restricted-imports`. Verify:
  - `npx expo-doctor` passes.
  - A temporary import of `react-native-mmkv` in `src/theme/` fails lint, and the existing `@/features/demo/components/X` probe still fails lint. Delete both probes.
- [x] 4.2 Write tests first, then implement:
  - `src/theme/resolve-scheme.ts` with a test: `system` + dark → dark, `system` + no value → light, and `light` + dark → light.
  - `src/theme/theme-mode-store.ts` (Zustand `persist` over the MMKV adapter, key `preferences.theme`, Zod-validated `merge`) with a test: the default is `system`, `setMode('dark')` persists, a restart restores it, and an unknown stored value becomes `system`.
  - Set up the MMKV mock as in design D14 inside a new `jest.setup.ts`, registered in `jest.config.js`.

  Verify: the tests fail before the modules exist and pass after.
- [x] 4.3 Implement `ThemeProvider`, `ThemeScope`, and `useTheme` in `src/theme/` (design D3): the `vars()` root view, the context `{ scheme, colors }`, the status bar style, `SystemUI.setBackgroundColorAsync`, the React Navigation theme from tokens, and `colorScheme.set(mode)`. Export the public API from `src/theme/index.ts`. Write `src/theme/ThemeProvider.test.tsx`:
  - `useTheme()` returns dark colors when the mode is `dark`
  - in `system` mode it follows a mocked `Appearance` change without remounting
  - `ThemeScope scheme="dark"` inside light mode gives dark colors to its children only
  - dark → system → device light gives light colors

  Verify: `npm test` passes.
- [x] 4.4 Wire `app/_layout.tsx` (design D10): import `global.css`, then `GestureHandlerRootView` → `ThemeProvider` → `Stack`. Add the bottom-sheet and toast providers later, in group 8. Install `react-native-gesture-handler` now with `npx expo install`. Rebuild and verify on the device:
  - with the device in dark appearance, the placeholder screen background is the dark `background`
  - switching the device appearance while the app is open switches the app
  - the status bar content is light in dark mode
- [x] 4.5 Update `STRUCTURE.md`:
  - the root provider order in `app/_layout.tsx`
  - the theme-mode preference as a Zustand store in `src/theme` backed by `src/lib/mmkv.ts`
  - `ThemeScope` for always-dark screens (Record)
  - the MMKV import rule

  Verify: `git diff STRUCTURE.md` shows only these points.
- [x] 4.6 Commit `feat(theme): add theme mode with system default and override`. Verify: `git status --short` is clean.

## 5. Geist fonts

- [x] 5.1 Run `npx expo install @expo-google-fonts/geist expo-font expo-splash-screen`. Add `src/theme/fonts.ts` exporting `GEIST_FONTS` (the four weights in design D5). In `app/_layout.tsx`, hold the splash screen with `preventAutoHideAsync()`, render `null` until `useFonts` has finished or failed, then hide it. Verify: `npx expo-doctor` and `npm run typecheck` pass.
- [x] 5.2 Configure the `expo-splash-screen` plugin in `app.json` with `backgroundColor` `#F8F6F5` and `dark.backgroundColor` `#100A09`. Extend `src/theme/tokens.test.ts` to assert that those values equal `colors.light.background` and `colors.dark.background` (design D10). Verify: `npm test` passes, and changing one of the two values in `app.json` makes it fail; undo that afterwards.
- [x] 5.3 Rebuild, then verify on the device:
  - a cold start shows the splash screen, then the placeholder screen in Geist, with no system-font frame
  - the same happens with airplane mode on
  - in dark appearance the splash background is dark
- [x] 5.4 Commit `feat(theme): load Geist fonts`. Verify: `git status --short` is clean.

## 6. Layout, text, and action components

- [ ] 6.1 Run `npx expo install react-native-svg` and `npm i lucide-react-native`. Complete `jest.setup.ts` (design D14: Reanimated, Gesture Handler, SVG if needed). Add `src/ui/test-utils.tsx` with `renderWithProviders(ui, { scheme })` (design D8). Verify: a throwaway test that renders a Lucide icon through the helper passes in both schemes; delete it afterwards.
- [ ] 6.2 Build **Icon** and **Text** with tests (design D8; spec `base-ui-components`):
  - Icon: the tone color comes from the scheme's tokens (light `muted` in light, dark `muted` in dark), it is hidden from accessibility without a label, and it is announced as an image with a label.
  - Text: display, title, and heading have the header role; each style uses its family; the tone defaults to `on-primary` inside a hero tone context; display and title have `maxFontSizeMultiplier` 1.4.

  Verify: `npm test` passes.
- [ ] 6.3 Build **Screen** and **Card** with tests:
  - Screen: renders children inside safe areas, the scroll variant scrolls and keeps taps while the keyboard is open (`keyboardShouldPersistTaps`), and the unpadded variant.
  - Card: a pressable Card calls `onPress` and has the button role; a hero Card makes its Text `on-primary`.

  Verify: `npm test` passes.
- [ ] 6.4 Build **Button** and **IconButton** with tests:
  - Button: press, disabled (no call, disabled state), loading (no call, busy state, indicator shown), each variant, the small size with a hit area of at least 44.
  - IconButton: the label is required (a `// @ts-expect-error` line in the test proves typecheck rejects it); announced as "Record, button"; the fab variant uses `fab` and `on-fab` in both modes.

  Verify: `npm test` and `npm run typecheck` pass.
- [ ] 6.5 Build **Chip**, **SectionHeader**, and **Skeleton** with tests:
  - Chip: the dot plus the label read as the label; a selectable chip reports `true` and announces selected.
  - SectionHeader: the header role, and its action calls back.
  - Skeleton: hidden from accessibility, and static (no animation started) when reduced motion is mocked on.

  Verify: `npm test` passes.
- [ ] 6.6 Add `src/ui/index.ts` exporting the components so far. Add the lint rule that `src/ui/**` may not import `@/features` (design D11.3). Verify: a temporary `@/features/demo` import in `src/ui/` fails lint; delete it, and then `npm run lint` and `npm run typecheck` pass.
- [ ] 6.7 Update `STRUCTURE.md` Testing and Styling: the `renderWithProviders` helper, component tests run in both modes, the `src/ui` import rule, and the screen-state mapping (design D9). Verify: `git diff STRUCTURE.md` shows only these points.
- [ ] 6.8 Commit `feat(ui): add layout, text, and action components`. Verify: `git status --short` is clean.

## 7. Text field and code input

- [ ] 7.1 Build **TextField** with tests: the visible label is the accessible name, the error message is shown with an icon in a live region, it is disabled, and it is multiline. The inside-a-sheet input switch comes in 8.6. Verify: `npm test` passes.
- [ ] 7.2 Write the **CodeInput** tests first, then build it (design D8):
  - typing six digits fills six cells and calls `onComplete` once with the string
  - pasting "123456" completes
  - "12a4 56" keeps "12456"
  - more than six digits are cut to six
  - the error state shows and announces its message
  - one accessible field carries the label and the value
  - `textContentType="oneTimeCode"` and `autoComplete="one-time-code"` are set

  Verify: the tests fail before the component exists and pass after.
- [ ] 7.3 Export both from `src/ui/index.ts`. Verify: `npm run typecheck` passes.
- [ ] 7.4 Commit `feat(ui): add text field and code input`. Verify: `git status --short` is clean.

## 8. Feedback and overlay components

- [ ] 8.1 Build **EmptyState**, **ErrorState**, and **Banner** with tests:
  - EmptyState: its action calls back.
  - ErrorState: default title and button text, retry calls once, retrying shows loading and ignores presses, polite live region.
  - Banner: message and icon, the dismiss button is labeled "Dismiss" and calls back, the action calls back, polite live region.

  Verify: `npm test` passes.
- [ ] 8.2 Build **Toast** (`ToastProvider`, `useToast`) with tests using Jest fake timers:
  - `show('Entry saved')` renders it and calls `AccessibilityInfo.announceForAccessibility`
  - it hides after 4s, or 6s with an action
  - pressing the action calls back and hides it
  - two quick toasts show one after the other

  Verify: `npm test` passes.
- [ ] 8.3 Build **Dialog** with tests:
  - confirm calls `onConfirm` once
  - cancel, backdrop, and `onRequestClose` (Android back) call `onCancel` only
  - a pending promise from `onConfirm` shows loading and blocks cancel until it settles
  - the title is rendered, and the modal has `accessibilityViewIsModal`

  Verify: `npm test` passes.
- [ ] 8.4 Recheck `@gorhom/bottom-sheet`'s latest version and its Gesture Handler note. Install it with `npm i`, and add its Jest mock to `jest.setup.ts`. Add the lint rule that allows it only in `src/ui/**` (design D11.2). Verify: `npx expo-doctor` passes, and a temporary import in `app/` fails lint; delete it afterwards.
- [ ] 8.5 Build **BottomSheet** with tests (design D8):
  - `open` presents and `false` dismisses
  - backdrop close and swipe close call `onClose` once
  - a `BackHandler` hardware back while open closes the sheet and returns `true`
  - the title has the header role
  - a TextField inside it renders `BottomSheetTextInput`

  Verify: `npm test` passes.
- [ ] 8.6 Add `BottomSheetModalProvider` and `ToastProvider` to `app/_layout.tsx` (design D10), and export the new components from `src/ui/index.ts`. Rebuild, then verify on the device with a temporary button on the placeholder screen:
  - the sheet opens, follows dark mode, closes by backdrop, swipe, and back, and keeps a focused TextField above the keyboard
  - a Dialog and a Toast follow dark mode

  **Gate:** if the sheet fails with Gesture Handler 3, stop and ask the owner about `@expo/ui/community/bottom-sheet` (design Risks). Remove the temporary button afterwards.
- [ ] 8.7 Commit `feat(ui): add feedback and overlay components`. Verify: `git status --short` is clean.

## 9. Development-only component gallery

- [ ] 9.1 Build `src/ui/gallery/` (design D13), with one section per base component and for the tokens:
  - type scale, color swatches with their names and values, mood scale with labels, Record palette
  - the System/Light/Dark switch on `useThemeMode`
  - a forced-dark sample in `ThemeScope`
  - buttons that open a BottomSheet (with a TextField), a Dialog, and a Toast

  Verify: `npm run typecheck` and `npm run lint` pass (no hex literals; values come from `tokens.ts`).
- [ ] 9.2 Add `app/dev/gallery.tsx` (thin, redirects to `/` when `!__DEV__`). Rebuild `app/index.tsx` with `Screen` and `Text`, keeping its texts, and show a `Link` to `/dev/gallery` only in `__DEV__`. Write `__tests__/app/dev/gallery.test.tsx` with `renderRouter`:
  - every section title renders
  - with `__DEV__` set to `false`, the route ends on `/`

  Extend `__tests__/app/index.test.tsx`: the link shows in development and is absent with `__DEV__` set to `false`. Verify: `npm test` passes.
- [ ] 9.3 On the device, open the gallery from the placeholder link and check:
  - every section in Light and in Dark, with no white flash and no system-font text
  - the forced-dark sample stays dark in Light
  - Dark persists after a restart
  - System follows the device appearance again
- [ ] 9.4 Update `STRUCTURE.md`: add `app/dev/gallery.tsx` (development only) to the routes table, and `src/ui/gallery/` as the one composed screen inside `src/ui`. Verify: `git diff STRUCTURE.md` shows only these points.
- [ ] 9.5 Commit `feat(ui): add dev-only component gallery`. Verify: `git status --short` is clean.

## 10. Final checks and Applied

- [ ] 10.1 Run the fresh-clone check: clone the local repository into a temporary directory, check out the branch, and run `npm ci`, `npm run typecheck`, `npm run lint`, and `npm test` with no `.env` and no dev server. Verify: all four exit 0. Delete the clone afterwards.
- [ ] 10.2 Run `npx expo-doctor` on the final tree, and check that `grep -rnE "'#[0-9a-fA-F]{3,8}'" app src --include='*.ts*' | grep -v '^src/theme/'` prints nothing. Verify: both are clean, and every earlier task in this file is checked.
- [ ] 10.3 Tick Applied for entry 2 in `ROADMAP.md`, and commit it with the final `tasks.md` as `docs: tick Applied for setup-design-system`. Verify: `git status --short` is clean, and `git log --oneline main..HEAD` shows the commits listed in design D16.

## Workflow follow-up

These steps come after Applied, as the apply guidance says. Explain each step in plain Indonesian.

- **Push (agent):** `git push -u origin feat/setup-design-system`.
- **Pull request (owner, browser):**
  1. Check that the avatar is `hafid-firman-febrian`.
  2. Use "Compare & pull request" with base `main`.
  3. Paste the title `feat: add design system` and the body the agent prepares: a summary, a link to `openspec/changes/setup-design-system/`, how it was verified, and two or three gallery screenshots in light and dark, attached by the owner.
- **CI:**
  - The owner watches the Checks tab, and the agent confirms through the public check-runs API.
  - If CI is red, the owner copies the failing lines. The agent fixes with a new commit and pushes.
- **Merge (owner, browser):** after green CI, use "Create a merge commit" → "Confirm merge" → "Delete branch".
- **Update local `main` (agent):** `git switch main && git pull`, `git branch -d feat/setup-design-system`, `git fetch --prune`.
- **Archive:** in a separate request, after the merge, use `openspec-archive-change`.
