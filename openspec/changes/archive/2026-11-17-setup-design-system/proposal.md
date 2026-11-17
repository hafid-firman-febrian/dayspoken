# Proposal

## Why

Every feature screen after this one (auth, the tab shell, Record, Home, Journal, Ask, Settings) is built from shared tokens and base components. Without them, each screen would pick its own colors, spacing, and fonts, and dark mode and contrast would be fixed screen by screen. This change implements **ROADMAP.md entry 2, `setup-design-system`**: the "Mono + Mood" visual system with the palette "Tomato", before any feature screen exists.

## What Changes

- **Styling:** NativeWind with semantic tokens. Components use class names such as `bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `border-border`, and `bg-primary`, never hex values.
  - Compatibility was checked on 2026-11-17: NativeWind's `latest` is 4.2.7 (Tailwind CSS v3), and its docs name Expo SDK 57. v5 is still a release candidate, and SDK 58 is still being tested.
  - This change uses the stable v4. Apply starts with a short compatibility spike on SDK 58. If the spike fails, apply stops and asks the owner (design D1).
- **Tokens, defined once per mode in `src/theme`:**
  - the Tomato palette (light and dark): background, surface, foreground, muted, border, primary, on-primary, accent, the record button (FAB) and its icon
  - the mood scale 1–5 (Rough, Low, Okay, Good, Great)
  - the Record palette (always dark): VoiceOrb gradient stops, Finish button, progress bar
  - typography, the 4pt spacing grid with a 20pt screen gutter, and radii (card 22, hero card 30, pills)
- **One structural token is added** that the palette did not list: `scrim`, the dimmed backdrop behind dialogs and sheets.
- **Contrast is tested:** a unit test computes the WCAG contrast of every text token pair (at least 4.5:1) and every icon-on-fill pair (at least 3:1). Today's palette passes. The mood colors fail as text color, so they are used only for dots, rings, and fills next to a label, never as text color.
- **Typography:** Geist for all text, loaded from `@expo-google-fonts/geist` (weights 400, 500, 600, 700). The splash screen stays up until the fonts are ready. Six text styles: display, title, heading, body, reading, caption.
- **Theme mode:** the app follows the system by default. A manual override (system / light / dark) is persisted in MMKV and applied app-wide: screens, sheets, dialogs, the status bar, navigation backgrounds, and the native root background. A screen can force dark mode for its subtree; the Record screen will use this.
- **Base UI in `src/ui`, each with component tests:** Screen, Text, Button, IconButton, TextField, CodeInput, Card, Chip, BottomSheet (`@gorhom/bottom-sheet`), Dialog, Toast, EmptyState, ErrorState, Banner, Skeleton, SectionHeader, Icon (Lucide).
- **Component gallery (development builds only):** a route at `/dev/gallery` shows every base component, its states, the type scale, the color tokens, and the mood scale. Its theme switch is the real system / light / dark override. The placeholder home screen links to it in development builds only.
- **Lint rules that make the styling rules mechanical:**
  - Hex color literals are rejected in `app/` and `src/`, except in `src/theme/`.
  - `@gorhom/bottom-sheet` may be imported only inside `src/ui/`, and `react-native-mmkv` only in `src/lib/mmkv.ts`.
  - `src/ui/` may not import feature code.
- **The placeholder home screen** is rebuilt with `Screen` and `Text`, so it follows the theme. It stays a placeholder.
- **Docs:** `STRUCTURE.md` and `openspec/config.yaml` are updated (see "Changes to agreed decisions"). `ROADMAP.md` gets its checkboxes ticked.

## Capabilities

### New Capabilities

- `design-tokens`: the semantic color tokens per mode, the mood scale, the Record palette, typography with Geist, spacing, radii, the contrast guarantees, and the rule that components use tokens instead of hex values.
- `theme-mode`: how the app chooses light or dark (system by default, a persisted manual override), how the choice reaches every surface including native chrome, and how a subtree can force dark mode.
- `base-ui-components`: the shared components in `src/ui`, their behavior, states, and accessibility guarantees.
- `component-gallery`: the development-only screen that shows every base component in light and dark.

### Modified Capabilities

_None._ `app-env-config` and `continuous-integration` keep their requirements. The new lint rules run inside the existing `npm run lint` check.

## Out of scope

- Feature UI: FloatingTabBar, TodayCard, WeekMoodStrip, MoodChip, MoodPicker, StreakBadge, VoiceOrb, RecordControls, ProgressBar, EntryCard, CitationCard, AudioPlayer, ProcessingStepper. Each comes with its feature change. This change only provides the tokens they use, such as the FAB and Record palettes.
- Real screens and navigation: auth screens (`add-email-otp-auth`), the tab shell and routes (`add-app-shell-navigation`), Record (`add-audio-recording`), and the Settings theme row (`add-settings-account`). The gallery's theme switch is a development tool, not the Settings UI.
- Supabase, TanStack Query, and anything that fetches data (`setup-supabase-backend` and later).
- Error-code-to-message mapping (it comes with the first change that receives server errors).
- App icon, adaptive icon colors, and store assets (`prepare-portfolio-release`).
- Web support. `react-native-web` stays uninstalled.
- NativeWind v5 or Tailwind CSS v4, unless the compatibility spike fails and the owner chooses it.
- Haptics, custom animations beyond the skeleton pulse, and the sheet and dialog transitions the libraries already provide.

## Cost impact

Rp 0. No new service. Every new dependency is open source and free:
- NativeWind (MIT), Tailwind CSS (MIT)
- Reanimated, Worklets, Gesture Handler (MIT)
- `@gorhom/bottom-sheet` (MIT)
- `react-native-mmkv` and `react-native-nitro-modules` (MIT)
- Zustand (MIT)
- `lucide-react-native` (ISC), `react-native-svg` (MIT)
- `@expo-google-fonts/geist` (MIT package; the Geist font is under the SIL Open Font License 1.1)
- `expo-font`, `expo-splash-screen`, `expo-system-ui` (MIT)

The fonts ship inside the app, so no font is downloaded at runtime. Several dependencies are native modules, so the development build is rebuilt locally once (no EAS).

## Changes to agreed decisions

**No product or visual decision changes.** The palette, mood scale, type scale, spacing, radii, and component list are the ones in `ROADMAP.md` entry 2.

**Where the token values live:**
- **Before:** `STRUCTURE.md` and `openspec/config.yaml` say the values are listed in `ROADMAP.md`.
- **Now:** `src/theme/tokens.ts` is the source of truth. `ROADMAP.md` keeps its prompt as the original request.
- **This change updates:**
  - `STRUCTURE.md` (Styling and theming)
  - `openspec/config.yaml` (the `context` line that points to `ROADMAP.md` for the token values)

**Details filled in** (recorded in design; the owner can adjust them at review):
- **New token:** `scrim` (light rgba(26, 18, 16, 0.4), dark rgba(0, 0, 0, 0.6)).
- **No extra status colors:** no separate danger, warning, or success colors. "Neutral UI" keeps meaning in icons and copy. A destructive confirmation uses the primary button with an explicit label such as "Delete".
- **Line heights and letter spacing** for each text style. The brief gives only the reading line height (1.6) and "tight" for display.
- **Caption sizes:** two sizes, 13 and 12, both weight 500.
- **Zustand** arrives now, for the theme-mode preference. It is in the agreed stack, and `STRUCTURE.md` names preferences as Zustand state.

**`STRUCTURE.md` also gains:**
- the dev-only gallery route
- the two new lint rules
- the root provider order
- the NativeWind setup files

Apart from that, `ROADMAP.md` is updated only by ticking boxes.

## Impact

- **New files:**
  - `babel.config.js`, `metro.config.js`, `tailwind.config.ts`, `nativewind-env.d.ts`, `jest.setup.ts`
  - `src/theme/`: tokens, contrast helper, global CSS, theme provider, theme scope, theme-mode store, font list, and their tests
  - `src/lib/mmkv.ts`
  - `src/ui/`: the 17 base components with tests, a test render helper, `index.ts`, and `gallery/`
  - `app/dev/gallery.tsx` and `__tests__/app/dev/gallery.test.tsx`
- **Edited files:**
  - `app/_layout.tsx` (providers, fonts, splash), `app/index.tsx` and its test
  - `app.json` (`userInterfaceStyle: automatic`, splash colors per mode, plugins)
  - `package.json`, `package-lock.json`, `jest.config.js`, `eslint.config.js`
  - `STRUCTURE.md`, `ROADMAP.md`, `openspec/config.yaml`
- **Owner's machine:** the Android development build is rebuilt once with `npx expo run:android`, because of the new native modules.
- **Git:** branch `feat/setup-design-system`, one pull request, CI as before.
