# Dayspoken: Project Structure

This document is the reference for how the Dayspoken codebase is organized:
- where files go
- where logic lives
- how data flows
- which conventions every change follows

Related files:
- **What to build next, and in what order:** [`ROADMAP.md`](ROADMAP.md).
- **The compact constraints injected into every OpenSpec run:** [`openspec/config.yaml`](openspec/config.yaml).

When a change alters anything described here, it updates this file in the same change.

## Folder layout

The repository is one repo, with folders grouped by feature.

```
dayspoken/
  app/                      Expo Router routes only (thin)
    _layout.tsx             providers, fonts, theme
    (auth)/                 welcome, sign-in, verify
    (tabs)/                 index (Home), journal, ask, settings + FloatingTabBar
    record.tsx              Record modal
    processing/[id].tsx
    entry/[id].tsx
    delete-account.tsx
  src/
    features/               one folder per feature:
      auth/ record/ entries/ home/ journal/ ask/ settings/ demo/
        components/ hooks/ api.ts types.ts index.ts (public API)
    ui/                     base components (design system), no business logic
    theme/                  tokens, typography, NativeWind setup
    lib/                    supabase client, query client, mmkv, sentry, env
    utils/                  pure functions (dates, local_date, formatting)
  supabase/
    migrations/             timestamped SQL
    functions/
      _shared/              ai-adapter/, quota, errors, db types
      process-entry/ ask/ delete-account/ reset-demo/
    seed.sql                demo account data
  e2e/                      Maestro flows
  docs/                     privacy policy (GitHub Pages), screenshots
  openspec/
```

| Folder | Purpose |
|---|---|
| `app/` | Expo Router routes only. Route files are thin: they compose screens from features |
| `src/features/<feature>/` | Everything one feature owns: `components/`, `hooks/`, `api.ts`, `types.ts`, and `index.ts` as its public API |
| `src/ui/` | Base components of the design system. No business logic and no data fetching |
| `src/theme/` | Semantic tokens, typography, and the NativeWind setup |
| `src/lib/` | Shared clients and setup: Supabase client, query client, MMKV, Sentry, env |
| `src/utils/` | Pure functions (dates, `local_date`, formatting) |
| `supabase/migrations/` | Timestamped SQL migrations |
| `supabase/functions/` | Edge Functions (Deno). `_shared/` holds the AI adapter, quota logic, error codes, and database types |
| `supabase/seed.sql` | Data for the demo account |
| `e2e/` | Maestro end-to-end flows |
| `docs/` | Privacy policy (served by GitHub Pages) and screenshots |
| `openspec/` | OpenSpec config, specs, and changes |

### Routes and screens

| Route | Screen |
|---|---|
| `app/(auth)/welcome.tsx` | S01 Welcome |
| `app/(auth)/sign-in.tsx` | S02 Sign In |
| `app/(auth)/verify.tsx` | S03 Verify Code |
| `app/(tabs)/index.tsx` | S04 Home |
| `app/(tabs)/journal.tsx` | S05 Journal (search and filter live here) |
| `app/(tabs)/ask.tsx` | S06 Ask |
| `app/(tabs)/settings.tsx` | S07 Settings |
| `app/record.tsx` | S08 Record (full-screen modal, always dark) |
| `app/processing/[id].tsx` | S09 Processing |
| `app/entry/[id].tsx` | S10 Entry Detail |
| `app/delete-account.tsx` | S13 Delete Account |

- S11 Edit Entry and S12 Filter are bottom sheets, not routes.
- S14 App Lock (Should) is a gate shown when the app opens.

## Where logic lives

```
  app/ (route)  -->  features/*/components  -->  features/*/hooks  -->  features/*/api.ts  -->  Supabase
   thin: composes      feature UI built          TanStack Query:         the only place that
   screens             from src/ui               cache, retry,           calls Supabase for
                                                 query keys              that feature
```

- **Business rules live on the server:** quotas, AI calls, and validating AI output belong to Edge Functions, database constraints, and RLS. The app never calls AI directly.
- **State has two homes:** server data lives only in TanStack Query. Zustand holds UI state only (the recording flow, preferences).
- **`src/ui` is pure UI:** it never fetches data and holds no business logic.
- **Features stay isolated:** a feature imports another only through that feature's `index.ts`. ESLint rejects deep imports such as `@/features/auth/components/X`.
- **No hex colors in components:** every color comes from a semantic token. ESLint rejects hex color literals in `app/` and `src/`, except in `src/theme/`.
- **One source of data types:** the TypeScript types generated from the database.
- **Stable error codes:** server errors use codes (`QUOTA_EXCEEDED`, `TRANSCRIPTION_FAILED`, …) that are mapped to UI messages in one place.
- **Secrets stay on the server:** the Gemini key and SMTP credentials live only in Supabase. The app only holds public values (`EXPO_PUBLIC_*`), and reads them only through `src/lib/env.ts`. ESLint rejects `process.env` anywhere else in `app/` and `src/`.

## Data flows

### Request path (app side)

A screen reads and writes data through its feature's hooks:

```
route (app/) -> feature component -> feature hook (TanStack Query) -> features/*/api.ts -> Supabase
```

### Capture pipeline

```
  APP                                  SUPABASE                              AI (via adapter)
  1. Finish recording
  2. Create entry  ------------------> entries.status = uploading
     Upload audio  ------------------> Storage: audio/{user_id}/{entry_id}.m4a
  3. Call process-entry ------------> Edge Function process-entry
                                         check quotas (reject if reached)
                                         reply "accepted", continue in background:
                                         status = transcribing  ---------------> transcript + language
                                         status = analyzing     ---------------> title, summary, mood 1-5,
                                                                                 tags (JSON, Zod-validated,
                                                                                 one retry if invalid)
                                         embedding              ---------------> one vector per entry
                                         status = ready | failed (+ error_code)
  4. Processing screen <------------- Realtime: entry status changes
```

- **Statuses:** `uploading → transcribing → analyzing → ready | failed`.
- **Leaving the screen:** the user may leave the Processing screen ("Continue in background"), and entry cards show the current status.
- **Retry:** it calls the same idempotent `process-entry` function again.
- **Embedding failures:** a failed embedding sets `embedding_status` to `pending` and is retried later. The entry still shows, but it cannot be found by Ask until its embedding is `ready`.
- **Entry fields:** `local_date` is the user's day, taken from the device timezone at recording time. Streaks and "today" use it.

### Ask flow

1. `ask` checks the quota.
2. It embeds the question.
3. It runs a pgvector similarity search within the user's own entries.
4. It sends the matches to the model with their dates, ordered by time. Questions like "when was I last…" need recency.
5. The model returns an answer plus `{entry_id, quote}` citations. The server verifies that each quote exists in that entry's transcript.
6. It saves the question, answer, and citations to `ask_logs`.

The app shows the answer with source cards that open the cited entries.

### Quotas

- **Per-user limits** are counted from `entries` and `ask_logs` for the user's `local_date` and checked against `plan_limits`. Free: 3 recordings and 5 Ask questions per day.
- **The global daily cap** for the whole app protects the free AI quota.
- **When a limit is reached**, the server returns `QUOTA_EXCEEDED`, and the app shows a friendly message ("Demo quota reached for today").
- **All limits are configuration** in `plan_limits`, never hardcoded.

### Offline behaviour

- Recording requires a connection.
- Data that was already loaded stays readable from the TanStack Query cache, and an offline banner is shown.
- Local audio stays on the device until its upload succeeds.

## Conventions

### Styling and theming

- **NativeWind with semantic tokens.** Components use class names such as `bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `border-border`, `bg-primary`, never hex values.
- **One place for tokens.** `src/theme/tokens.ts` is the source of truth. Tokens are defined once per mode (light and dark), so changing the palette means editing that one file. The Tailwind config, the CSS variables, `useTheme()`, and the contrast tests all read from it. It holds the values of palette "Tomato"; the `setup-design-system` entry of `ROADMAP.md` keeps the original request.
- **Utilities.** Beyond the semantic color classes: `text-display`, `text-title`, `text-heading`, `text-body`, `text-reading`, `text-caption`, `text-caption-sm` (size, line height, letter spacing), `font-geist`, `font-geist-medium`, `font-geist-semibold`, `font-geist-bold`, `px-gutter` (20pt), `rounded-card` (22), `rounded-hero` (30), `bg-mood-1` to `bg-mood-5`, and `bg-record-background`, `bg-record-finish`, `bg-record-progress`. Spacing is Tailwind's 4pt grid (`p-1` is 4pt). Buttons and chips are pills (`rounded-full`).
- **Theme mode.** The theme follows the system, with a manual override (system / light / dark) in Settings.
- **Mood colors carry meaning.** Mood is a 1–5 scale (Rough, Low, Okay, Good, Great), defined in `src/theme/mood.ts`. A mood is never shown by color alone; it always has its label. Mood colors are indicators only (dots, rings, fills): none of them reaches 4.5:1 as text, so the label uses `foreground` or `muted`, never a mood color.
- **Contrast.** Text contrast must be at least 4.5:1.
- **Font and icons.** Geist for all text, Lucide for icons.
- **Base UI (`src/ui`):** Screen, Text (Geist variants), Button, IconButton, TextField, CodeInput, Card, Chip, BottomSheet, Dialog, Toast, EmptyState, ErrorState, Banner, Skeleton, SectionHeader, Icon.
- **Feature UI** lives in its feature's `components/` folder and is built from base UI: FloatingTabBar, TodayCard, WeekMoodStrip, MoodChip, MoodPicker, StreakBadge, VoiceOrb, RecordControls, ProgressBar, EntryCard, CitationCard, AudioPlayer, ProcessingStepper.
- **Screen states.** Empty, loading, error, offline, and quota-reached (per user or global) are states of each screen, not separate screens.

### State

- **Server data:** TanStack Query only.
- **UI state:** Zustand only (the recording flow, preferences).
- **Local storage:** MMKV for cache, preferences, and audio waiting to upload. The session is stored securely.

### Errors

- Edge Functions return stable error codes (`QUOTA_EXCEEDED`, `TRANSCRIPTION_FAILED`, …).
- The app maps those codes to user-facing messages in one place.

### Config and secrets

- **The app only holds public values** (`EXPO_PUBLIC_*`).
  - They are read and validated in `src/lib/env.ts`. An invalid value fails with an error that names the variable.
  - Every variable is documented in `.env.example`. Local `.env` and `.env*.local` files are not committed.
- **Secrets live only as Supabase secrets** (Gemini key, SMTP credentials).
- **AI config.** All AI calls go through the AI adapter in `supabase/functions/_shared/ai-adapter/`. It is configured per environment: the provider, plus a model per task (`process-entry` and `ask` separately).
- **Separate projects.** Development and production use separate Google projects, because AI limits are per project.
- **Embeddings always come from one model.** Vectors from different models cannot be compared.
- **The app never calls AI providers.**

### Data and backend

- Schema changes are timestamped SQL migrations in `supabase/migrations/`.
- Every table has RLS: users only see their own rows.
- TypeScript types are generated from the database and are the single source of data types.
- Audio lives in a private bucket at `audio/{user_id}/{entry_id}.m4a`, compressed to about 32 kbps mono, and is played through expiring signed URLs.

### Imports

- **`@/` points to `src/`.** For example `@/lib/env`.
- **Inside a feature,** use relative imports.
- **Another feature** is imported only through its `index.ts` (`@/features/auth`).

### Testing

- **Unit and component tests:** Jest and React Native Testing Library. Each test sits next to the file it tests.
- **Route tests are the exception.** Expo Router treats every file in `app/` as a route, so route tests live in `__tests__/app/` and mirror the route path (`__tests__/app/index.test.tsx`).
- **Edge Functions:** Deno tests.
- **End-to-end:** Maestro flows live in `e2e/`.
- **Check scripts:**
  - `npm run typecheck`: TypeScript in strict mode.
  - `npm run lint`: ESLint, with Prettier formatting reported as lint errors.
  - `npm test`: Jest.
  - `npm run format`: rewrites files with Prettier. Markdown docs and `openspec/` are not formatted.
- **CI:** GitHub Actions runs typecheck, lint, and tests on every pull request to `main` and every push to `main`, with the Node version from `.nvmrc`. CI must be green before merging.

## Naming conventions

| Item | Convention | Example |
|---|---|---|
| Component file | PascalCase | `EntryCard.tsx`, `VoiceOrb.tsx` |
| Hook file | camelCase starting with `use` | `useEntries.ts` |
| Other file | kebab-case | `query-keys.ts`, `local-date.ts` |
| Route file | lowercase kebab-case | `sign-in.tsx`, `delete-account.tsx` |
| Test | next to the tested file; route tests in `__tests__/app/` | `local-date.test.ts`, `EntryCard.test.tsx` |
| Database table/column | snake_case, plural tables | `entries`, `ask_logs`, `local_date` |
| Edge Function folder | kebab-case | `process-entry/` |
| Type | PascalCase, no `I` prefix | `Entry`, `MoodLevel` |
| Constant | SCREAMING_SNAKE | `MAX_RECORDING_SECONDS` |

## Git workflow

Each OpenSpec change follows the same flow:

```
OpenSpec change -> branch -> implement + commits -> push -> PR + green CI -> merge -> archive change
```

- **One branch per change:** `feat/<change-name>`, merged into `main` through a pull request.
- **The plan travels with the change.** The change's folder `openspec/changes/<change-name>/` is committed on its branch, so the pull request shows the plan next to the code.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:` …).
- **CI must be green** before merging.
- **Merging:** use "Create a merge commit", then delete the branch.
- **Archiving:** after the merge, the change is archived, and the archive edits are committed to `main` as `chore(openspec): archive <change-name>`.
- **Package manager:** npm.
- **Who does what.** The project owner is new to pull requests.
  - The agent runs the local `git` commands (branch, commit, push).
  - The owner does the GitHub steps in the browser: opening the pull request, watching CI, and merging.
  - The agent explains every step in plain Indonesian.
  - The first full walkthrough happens in `setup-project-foundation`.
  - There is no GitHub CLI login. The agent reads pull request and CI status through the public GitHub API.

## Language

- **English:** code, comments, commits, OpenSpec artifacts, the README, and docs.
- **English:** app UI copy. Recordings can be in any language (auto-detected), and each entry is written in the language that was spoken.
- **Bahasa Indonesia:** the conversation with the project owner.
