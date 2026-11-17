# Design

## Context

- **Repository state:**
  - Git is initialized on `main`, but there are no commits yet.
  - OpenSpec 2.0 is initialized with the `spec-driven` schema. There are no specs and no other changes.
  - `openspec/config.yaml` still holds the commented template (only `schema: spec-driven`).
  - OpenSpec skills are installed for Claude Code (`.claude/skills/`) and other agents (`.agents/skills/`): `openspec-explore`, `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `openspec-sync-specs`, `openspec-update-change`.
- **Source of truth:** every decision used by this change comes from the explore session on 2026-11-16 and is recorded in **Appendix A** below. The apply run has no access to that conversation, so it must write the three files from Appendix A only. It must not add product, stack, or process decisions that are not there.
- **Size limit:** OpenSpec reads `context` from `openspec/config.yaml` only if it is a string of at most 51,200 bytes (UTF-8).
- **Config is injected everywhere:** the `context` and `rules` blocks are injected into every future artifact's instructions. Every byte there is paid on every planning run.

## Goals / Non-Goals

**Goals:**
- One place for each kind of information:
  - **`openspec/config.yaml`:** the compact constraints every change must respect.
  - **`STRUCTURE.md`:** the full structure and convention reference.
  - **`ROADMAP.md`:** the order of the work, its status, and how to start each change.
- Make each roadmap entry startable without the original chat. Its propose prompt carries the decided details for that change.
- Make progress tracking mechanical. The checkbox meaning is defined once, and the apply/archive guidance says exactly when to tick each box.

**Non-Goals:**
- No product specs (`openspec/specs/`). Each feature change writes its own specs when it is proposed.
- No app code, `package.json`, Expo project, Supabase project, GitHub repository, or CI. Those start in `setup-project-foundation`.
- No README. It belongs to `prepare-portfolio-release`.
- No copy of the HTML design previews. They were not included in the request.

## Decisions

### D1. Both documents live at the repository root

`STRUCTURE.md` and `ROADMAP.md` live at the repository root.
- **Why:** they are the first files a reviewer or an agent should see, and they are referenced from `openspec/config.yaml` by plain relative path.
- **Alternative rejected:** `docs/`. That folder is reserved for the privacy policy (GitHub Pages) and screenshots.

### D2. Each file has its own job, with minimal overlap

| File | Holds | Size target |
|---|---|---|
| `openspec/config.yaml` `context` | App summary, hard constraints (Rp 0, language), key product decisions, stack, structure rules in short form, the "verify at implementation" list | Well under 10 KB |
| `openspec/config.yaml` `rules` | Per-artifact rules for `proposal`, `design`, `tasks` | Short lists |
| `openspec/config.yaml` `operations` | Apply and archive guidance, including ROADMAP ticking and Git steps | Short lists |
| `STRUCTURE.md` | Folder tree, layering and where logic lives, naming, data flows, styling/state/error/config conventions, testing, Git workflow, language rule | Human-readable reference |
| `ROADMAP.md` | Checkbox legend, changes 0–18 in order, Later changes in order, a propose prompt per change | One section per change |

- **Why:** the context points to `STRUCTURE.md` for detail instead of copying it. Agents get the rules on every run, and the long explanations are read only when needed.
- **Alternative rejected:** everything in `config.yaml`. That repeats a large text in every artifact and makes it harder for a human to read.

### D3. What each checkbox means and who ticks it

| Box | Meaning | Ticked when |
|---|---|---|
| Proposed | All planning artifacts of the change exist | At the start of apply (the propose skill has no hook and must stay planning-only) |
| Reviewed | The user has read the artifacts and wants to build them | At the start of apply. The user's request to apply is the approval; if the agent is unsure, it asks |
| Applied | Every task in `tasks.md` is checked and the checks (typecheck, lint, tests) pass | At the end of apply |
| Archived | The change is archived with `openspec archive` | During the archive run |

- **Why:** the user asked for ticking to live in the apply and archive guidance. Proposed and Reviewed cannot be ticked during propose without breaking its planning-only boundary.
- **Alternative rejected:** a fifth "Merged" box. It was not requested. The PR merge is covered by the archive guidance instead: archive only after the PR is merged.

### D4. Propose prompt format

Each roadmap entry carries one fenced `text` block that starts with `/openspec-propose <change-name>:`. The block contains:
- the one-line scope
- the decided details from Appendix A that belong to this change
- an explicit "Out of scope" line naming the neighbouring roadmap items

Prompts reference `STRUCTURE.md` and `openspec/config.yaml` instead of repeating global rules.

- **Why:** the user invokes changes this way, as this change was invoked. A self-contained prompt keeps each change to its agreed scope.

### D5. `openspec/config.yaml` shape

- Keep `schema: spec-driven`.
- Add `context` as a YAML literal block (`|`).
- Add `rules.proposal`, `rules.design`, and `rules.tasks` as string lists.
- Add `operations.apply.guidance` and `operations.archive.guidance` as string lists.
- Drop the template comments.
- **Check after writing:**
  1. `openspec context --json` resolves the root.
  2. `openspec instructions proposal --change project-blueprint --json` shows the new context and proposal rules.
  3. The `context` string is under 51,200 bytes.

### D6. Git handling for this change

- This change makes **no commit**.
- The repository has no commits and no GitHub remote yet. The branch-and-PR workflow (and teaching the user how it works) starts in `setup-project-foundation`.
- That change begins by committing these files to `main` as the initial commit.
- Change 0 is therefore archived without a PR, which the archive guidance states explicitly.

### D7. Archive happens after merge, as a small commit on `main`

- The agreed order is: change → branch → implement + commits → push → PR + green CI → merge → archive.
- Archiving after the merge edits files (it moves the change folder, syncs specs, and ticks ROADMAP).
- The archive guidance therefore commits those edits to `main` as one docs-only Conventional Commit: `chore(openspec): archive <change-name>`.
- **This is an assumption.** It is the smallest step that keeps the agreed order. If the user later protects `main`, the guidance must switch to a short archive PR.

### D8. Language

- All three files are written in English: code, commits, OpenSpec artifacts, and docs are English per the structure decision.
- The guidance tells agents to talk to the user in Bahasa Indonesia, and to explain Git and GitHub steps in plain Indonesian, because the user is new to pull requests.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| `context` grows over time and becomes expensive or noisy | Keep only constraints in `context`. Details live in `STRUCTURE.md`. A rule asks changes that alter a decision to update the right file |
| Decisions drift as changes land, and the documents go stale | A proposal rule makes any change that alters an agreed decision say so and list which of `STRUCTURE.md`, `ROADMAP.md`, or `config.yaml` it updates |
| Free-tier facts (quotas, terms) are unverified or change | They stay in a "verify at implementation" list in `context`. Changes 3, 4, 7, and 18 recheck them against official pages |
| Ticking is forgotten | It is part of the apply and archive guidance. Apply ends with an explicit ROADMAP check |
| D7 is wrong once `main` is protected | Noted in D7. The fix is a one-line change to the archive guidance |

## Appendix A: Decision record (explore session, 2026-11-16)

This appendix is the only allowed source for the content of `STRUCTURE.md`, `ROADMAP.md`, and `openspec/config.yaml`.

### A1. Problem and target user

- **Problem:**
  1. Writing a journal feels like work, so people quit within a week.
  2. Old entries are never reread, so journaling feels pointless.
- **Solution:** talking for 1–3 minutes is lighter than writing, and AI makes entries searchable and askable. Point 2 is the differentiator.
- **Persona:** busy professionals, 25–40, who tried journaling and quit.
- **Hero demo:** "ask your past self", for example *"When was I last stressed about work?"*
- **Two audiences:** the in-app user, and the Upwork client who judges the demo, repo, and APK.
- **Portfolio signal:** an AI-powered mobile app (speech-to-text, LLM, semantic search/RAG) with enough production-grade quality to convince: real auth, clear error states, safe data. UI is clean and consistent, not an animation showpiece.
- **Language:**
  - UI copy is in English.
  - Recordings can be in any language with auto-detection.
  - Each entry is written in the language that was spoken.

### A2. Core loop

- **Capture:** Home → Record → upload → Processing → entry ready → optional light correction → Home (streak +1).
- **Retrieve:** Journal (browse and search) ↔ Ask (answer with clickable citations) → Entry Detail.
- **Recording rules:**
  - Maximum 3:00, with a warning at 2:30, then auto-stop.
  - Minimum about 10 seconds.
  - Pause and resume.
  - One optional random prompt that the user may ignore.
- **Processing:**
  - A step-by-step progress screen. The user may leave it ("Continue in background"), and entry cards show the status.
  - Statuses: `uploading → transcribing → analyzing → ready | failed`, with retry.
- **Entries:**
  - Several entries per day are allowed, each standing alone.
  - Timelines are grouped by day.
  - The streak counts days with at least one entry.
- **Ask:** one question returns one answer, with citations that link to the source entries. Multi-turn chat is Later.

### A3. MVP scope

- **Must:**
  - Short onboarding. The mic permission is requested the first time Record is used.
  - Email OTP auth.
  - Recording.
  - AI pipeline: transcript, title, summary, mood 1–5, tags, language detection.
  - Entry status with retry.
  - **Home:** Today card with remaining quota, mood strip, streak, recent entries.
  - **Journal:** grouped by day, keyword search, filter by mood and tag.
  - **Entry Detail:** audio playback; edit title, mood, and tags; delete.
  - Ask with citations.
  - **Settings:** account, today's usage, theme, privacy, sign out, delete account with all data.
  - Light and dark theme from day one.
  - "Try the demo" account, reset nightly.
  - Privacy notice and privacy policy page.
- **Should:** daily reminder (local notification), biometric app lock.
- **Later:**
  - Mood insights (first after the MVP).
  - Cloudflare AI fallback.
  - Offline recording queue.
  - Google/Apple sign-in (before a store release).
  - Ask as chat.
  - Weekly recap.
  - Calendar view.
  - Transcript editing with re-analysis.
  - Export (Markdown/PDF).
  - Audio auto-delete setting.
  - Push notification when an entry is ready.
  - Paywall with a Pro tier (RevenueCat).
- **Quotas:**
  - Server-side, stored as configuration and not hardcoded.
  - Free: 3 recordings and 5 Ask questions per user per day.
  - Pro draft for later: 10 and 50, plus insights, export, and Ask chat.
  - A global daily cap for the whole app protects the free AI quota. When it is reached, the user sees a friendly message ("Demo quota reached for today").
- **Audio:** kept for playback.
- **Cost:**
  - Production must cost **Rp 0**. Only official free tiers are used.
  - Distribution is an Android APK on GitHub Releases. iOS is shown in the demo video only.
  - A store release (Play $25 once, Apple $99 per year) is a separate later phase.

### A4. Screens

- **Navigation:** a floating pill tab bar with Home, Journal, Ask, Settings, and a raised record button in the middle. Search lives inside Journal. Ask is its own tab.
- **Onboarding:** one Welcome screen. The mic permission primer appears on the first Record tap.

| ID | Screen | Type | Main content | Key states |
|---|---|---|---|---|
| S01 | Welcome | auth | Value proposition, "Get started", "Try the demo" | - |
| S02 | Sign In | auth | Email input | Invalid email, loading |
| S03 | Verify Code | auth | 6-digit code, resend with timer | Wrong code, expired |
| S04 | Home | tab | Date, streak, greeting, week mood strip, Today card with prompt and record button, remaining quota, recent entries | No entries yet, entry processing |
| S05 | Journal | tab | Search bar, filter chips, entries grouped by day with sticky date headers | Empty, no results, skeleton |
| S06 | Ask | tab | Question input, example questions, answer with source cards | Fewer than 3 entries, loading, quota reached |
| S07 | Settings | tab | Account email, today's usage, theme (system/light/dark), privacy notice and policy link, sign out, delete account. Reminder time is a row here (Should) | - |
| S08 | Record | full-screen modal, always dark | Mic permission primer (first time), prompt, timer, VoiceOrb, progress, Discard / Finish / Pause | Permission denied, 2:30 warning, too short |
| S09 | Processing | continues the modal | Stepper Uploading → Transcribing → Analyzing, "Continue in background" | Failed with retry |
| S10 | Entry Detail | stack | Date, title, mood, summary, tags, audio player, transcript, edit and delete | Processing, failed with retry |
| S11 | Edit Entry | bottom sheet | Title, mood picker, tag editor | - |
| S12 | Filter | bottom sheet | Mood and tag pickers | - |
| S13 | Delete Account | stack | Consequences, type "DELETE" to confirm | Loading, error |
| S14 | App Lock (Should) | gate | Biometric unlock | - |

- **Principle:** empty, loading, error, offline, and quota-reached (per user or global) are states of each screen, not separate screens.

### A5. Visual system

- **Direction:** "Mono + Mood".
  - Neutral UI and bold, tight sans-serif headings.
  - Rounded cards.
  - A floating pill tab bar.
  - Mood colors carry meaning.
  - The Record screen is always dark, with an animated, breathing **VoiceOrb**.
  - The earlier "Warm Journal" direction (cream paper, serif, terracotta) was rejected as old-fashioned.
- **Home layout:**
  - Date and a streak chip.
  - The headline "Good evening."
  - A 7-day mood strip with today drawn as a dashed ring.
  - A Today hero card on `primary`, showing "Today's prompt", the prompt, "Up to 3 min · any language", and a round mic button.
  - "Recent" entry cards showing date, duration, mood chip, title, and summary.
- **Palette "Tomato" (semantic tokens):**

| Token | Light | Dark |
|---|---|---|
| background | `#F8F6F5` | `#100A09` |
| surface | `#FFFFFF` | `#1B1312` |
| foreground | `#1A1210` | `#FBF3F1` |
| muted | `#6E6460` | `#B09E99` |
| border | `#ECE6E3` | `#2D2120` |
| primary (Today card) | `#CC3F27` | `#CC3F27` |
| on-primary | `#FFFFFF` | `#FFFFFF` |
| record button (FAB) | `#CC3F27` with white icon | `#E8573C` with `#1A0603` icon |
| accent (streak, links) | `#CC3F27` | `#FB8A6E` |

- **Today card:**
  - Text on the card is white.
  - The mic button is white with a `#CC3F27` icon.
- **Record screen:**
  - Background `#100A09`.
  - Orb gradient: `#FFFFFF` → `#FDC8B8` → `#E8664C` → `#7A2213`.
  - Finish button `#E8573C` with a white square.
  - Progress bar `#FB8A6E`.
- **Mood scale:** 1 Rough `#6366F1`, 2 Low `#0EA5E9`, 3 Okay `#A8A29E`, 4 Good `#10B981`, 5 Great `#FBBF24`. A mood is never shown by color alone; it always has its label.
- **Typography:** Geist for everything.

| Style | Spec |
|---|---|
| display | 38 / 700, tight tracking |
| title | 27 / 600 |
| heading | 18 / 600 |
| body | 16 |
| reading (transcript) | 17, line-height 1.6 |
| caption | 12–13 / 500 |

- **Spacing:** 4pt grid, screen padding 20.
- **Radius:** card 22, hero card 30, buttons and chips are pills.
- **Icons:** Lucide. Text contrast must be at least 4.5:1.
- **Theme:** follows the system, with a manual override in Settings.
- **Styling:** NativeWind with semantic tokens (`bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `border-border`, `bg-primary`, …). Tokens are defined once per mode, so changing the palette means editing one place.
- **Base UI (`src/ui`):** Screen, Text (Geist variants), Button, IconButton, TextField, CodeInput, Card, Chip, BottomSheet, Dialog, Toast, EmptyState, ErrorState, Banner, Skeleton, SectionHeader, Icon.
- **Feature UI:** FloatingTabBar, TodayCard, WeekMoodStrip, MoodChip, MoodPicker, StreakBadge, VoiceOrb, RecordControls, ProgressBar, EntryCard, CitationCard, AudioPlayer, ProcessingStepper.

### A6. Data model and backend

- **Backend:** Supabase Free (Postgres with pgvector, Auth, Storage, Edge Functions on Deno, Realtime, cron).
- **Tables:**
  - **`profiles`:** id (= `auth.users.id`), timezone, plan (`free`), is_demo, reminder_time (Should), created_at.
  - **`entries`:**
    - id, user_id, `local_date` (the user's day, taken from the device timezone at recording time), recorded_at, duration_sec, audio_path, language, prompt.
    - status (`uploading|transcribing|analyzing|ready|failed`), error_code.
    - transcript, title, summary, mood (1–5), `mood_source` (`ai|user`), tags (`text[]`, lowercase, max 5).
    - embedding (one vector per entry, from transcript and summary), `embedding_status` (`pending|ready|failed`).
    - search (generated tsvector over title, summary, transcript, tags with the `simple` config).
    - created_at, updated_at.
  - **`ask_logs`:** id, user_id, local_date, question, answer, `citations` (JSON list of `{entry_id, quote}`), created_at. Stored for quota counting and for a future chat. No history screen in the MVP.
  - **`plan_limits`:** per plan, recordings_per_day and asks_per_day (free 3/5, pro 10/50), plus the global daily caps.
- **Quotas:** counted from `entries` and `ask_logs` per `local_date`, checked against `plan_limits` and the global cap.
- **Storage:**
  - A private bucket at `audio/{user_id}/{entry_id}.m4a`.
  - Audio is compressed to about 32 kbps mono (around 0.7 MB per 3 minutes).
  - Playback uses expiring signed URLs.
- **Capture pipeline:**
  1. The app creates the entry (`uploading`) and uploads the audio.
  2. The app calls the Edge Function `process-entry`.
  3. The function checks quotas, replies "accepted", and continues in the background:
     1. transcribing (transcript and language)
     2. analyzing (title, summary, mood, tags as JSON validated with Zod, one retry if invalid)
     3. embedding
     4. `ready`, or `failed` with an error code
  4. The app follows the status through Realtime.
  - Retry calls the same idempotent function.
  - A failed embedding is marked `pending` and retried later; the entry still shows.
- **Ask:**
  1. Check the quota.
  2. Embed the question.
  3. Run a pgvector similarity search within the user's entries.
  4. Send the matches to the model with their dates, ordered by time (questions like "when was I last…" need recency).
  5. The model returns an answer plus `{entry_id, quote}` citations. The server verifies each quote exists in that entry's transcript.
  6. Save to `ask_logs`.
- **Edge Functions:** `process-entry`, `ask`, `delete-account` (removes the audio folder and the auth user; rows cascade), `reset-demo` (nightly cron).
- **Security:** RLS on every table (users only see their own rows). Secrets (AI keys, SMTP) are only Supabase secrets.
- **Offline:**
  - Recording requires a connection.
  - Data that was already loaded stays readable from cache, and an offline banner is shown.
  - Local audio is kept until the upload succeeds.
- **Operations:**
  - A scheduled GitHub Actions ping keeps the free Supabase project from pausing.
  - Free SMTP (Gmail app password or Brevo) delivers the OTP, because Supabase's built-in email is for testing only.

### A7. Tech stack

- **App:**
  - Expo SDK (latest stable at setup), TypeScript strict, Expo Router.
  - A development build (`expo-dev-client`). EAS Build free tier or local builds.
- **Libraries:**
  - expo-audio (record, playback, metering)
  - Reanimated and react-native-skia (VoiceOrb, waveform)
  - TanStack Query (server state), Zustand (UI state), Zod (forms and AI output)
  - MMKV (cache, preferences, audio waiting to upload; the session is stored securely)
  - @gorhom/bottom-sheet, lucide-react-native, Geist via expo-font
  - expo-notifications (local), expo-local-authentication
- **Backend tooling:** Supabase CLI, SQL migrations in the repo, a local database, generated TypeScript types from the database, Deno tests for Edge Functions.
- **AI:**
  - The Gemini API free tier (Flash models) handles transcription, entry analysis, Ask, and embeddings.
  - All of it goes through an **AI adapter** configured per environment: provider, plus a model per task (`process-entry` and `ask` separately).
  - Embeddings always come from one model, because vectors from different models cannot be compared.
  - Development and production use separate Google projects, because limits are per project.
  - The app never calls AI providers.
  - Switching to a paid provider (for example Claude or OpenAI) is a configuration change through the adapter.
  - A Cloudflare Workers AI fallback is Later.
  - The user's 9router (on a VPS) is a personal coding tool only. The app does not use it.
- **Quality:** Jest and React Native Testing Library, Maestro E2E, ESLint and Prettier, GitHub Actions CI (typecheck, lint, test), Sentry free plan.
- **Package manager:** npm.
- **Verify at implementation time (do not assume):**
  - Gemini free-tier quotas and data terms
  - Cloudflare Workers AI quotas
  - Expo SDK and NativeWind version compatibility
  - Geist availability for expo-font
  - Supabase Free pause policy and SMTP limits
  - EAS free build limits

### A8. Structure and conventions

- **Repository:** one repository, with folders grouped by feature.

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

- **Where logic lives:** route (`app/`) → feature components → feature hooks (TanStack Query) → `features/*/api.ts` (the only place that calls Supabase for that feature) → Supabase.
  - Business rules (quotas, AI calls, validating AI output) live on the server: Edge Functions, database constraints, RLS. The app never calls AI directly.
  - Server data lives only in TanStack Query. Zustand holds UI state only (the recording flow, preferences).
  - `src/ui` never fetches data and holds no business logic.
  - Features import each other only through their `index.ts`.
  - No hex colors in components; every color comes from a semantic token.
  - The generated database types are the single source of data types.
  - Server errors use stable codes (`QUOTA_EXCEEDED`, `TRANSCRIPTION_FAILED`, …), mapped to UI messages in one place.
  - Secrets (Gemini key, SMTP) live only in Supabase. The app only holds public values (`EXPO_PUBLIC_*`).
- **Naming:**

| Item | Convention | Example |
|---|---|---|
| Component file | PascalCase | `EntryCard.tsx`, `VoiceOrb.tsx` |
| Hook file | camelCase starting with `use` | `useEntries.ts` |
| Other file | kebab-case | `query-keys.ts`, `local-date.ts` |
| Route file | lowercase kebab-case | `sign-in.tsx`, `delete-account.tsx` |
| Test | next to the tested file | `local-date.test.ts`, `EntryCard.test.tsx` |
| Database table/column | snake_case, plural tables | `entries`, `ask_logs`, `local_date` |
| Edge Function folder | kebab-case | `process-entry/` |
| Type | PascalCase, no `I` prefix | `Entry`, `MoodLevel` |
| Constant | SCREAMING_SNAKE | `MAX_RECORDING_SECONDS` |

- **Language:** code, comments, commits, OpenSpec artifacts, README, and docs are in English. The conversation with the user is in Bahasa Indonesia.
- **Git:**
  - One branch per OpenSpec change (`feat/<change-name>`), merged into `main` through a PR.
  - Conventional Commits (`feat:`, `fix:`, `chore:` …).
  - CI must be green before merging.
  - The user is new to pull requests and asked to be taught. The agent runs the `git`/`gh` commands and explains each step in plain Indonesian; the first full walkthrough happens in `setup-project-foundation`.
  - The user needs a GitHub account and must run `gh auth login` once.
- **Flow:** OpenSpec change → branch → implement + commits → push → PR + green CI → merge → archive change.

### A9. Roadmap (ordered; each change takes about 1–3 days)

Fundamentals before features, and the design system before any feature screen.

| # | Change | Scope and decided details |
|---|---|---|
| 0 | `project-blueprint` | Capture the explore decisions as `STRUCTURE.md`, `ROADMAP.md`, `openspec/config.yaml`. No code (this change) |
| 1 | `setup-project-foundation` | Expo app scaffold (TypeScript strict, Expo Router, development build), folder structure from A8, ESLint/Prettier/Jest, env config (`EXPO_PUBLIC_*`), GitHub repository and CI (typecheck, lint, test), the initial commit of the blueprint files, and the user's first guided PR |
| 2 | `setup-design-system` | NativeWind with the Tomato semantic tokens (light/dark, A5), Geist, the theme mode (system/light/dark with persisted override), every base UI component from A5, and a dev-only component gallery screen |
| 3 | `setup-supabase-backend` | Supabase project (local and cloud), migrations for `profiles`, `entries`, `ask_logs`, `plan_limits` (A6), RLS, the private audio bucket, generated types, the app client, and the keep-alive ping workflow |
| 4 | `add-email-otp-auth` | Welcome (with privacy notice and "Try the demo" placeholder), Sign In, Verify Code; Supabase email OTP through free SMTP; secure session storage; routing guard; sign out |
| 5 | `add-app-shell-navigation` | Floating pill tab bar with the center record button, placeholder tab screens, routes for the Record modal, Processing, Entry Detail, Delete Account |
| 6 | `add-audio-recording` | Record screen: permission primer, optional prompt, timer, pause/resume, 10 s minimum, 3:00 maximum with 2:30 warning, metering, VoiceOrb, Discard/Finish/Pause, keep the local file |
| 7 | `add-ai-processing-pipeline` | Edge Function `process-entry`: AI adapter (Gemini), transcription, analysis JSON with Zod and one retry, embedding with `embedding_status`, per-user and global quotas, stable error codes, idempotent retry, Deno tests. Design decides whether transcription and analysis are one call or two, keeping the statuses meaningful |
| 8 | `add-entry-capture-flow` | Compress (about 32 kbps mono) and upload audio, create the entry, Processing screen with the Realtime stepper and "Continue in background", retry, keep local audio until upload succeeds, offline banner |
| 9 | `add-home-screen` | Home per A5: streak by `local_date`, week mood strip, Today card with prompt and remaining quota, recent entries, empty states |
| 10 | `add-entry-detail` | Audio playback via signed URL, summary, transcript, Edit Entry sheet (title, mood with `mood_source = user`, tags), delete with confirmation dialog |
| 11 | `add-journal-search` | Journal list grouped by day with sticky headers, pagination, keyword full-text search, Filter sheet (mood, tags) |
| 12 | `add-ask-journal` | Edge Function `ask` (A6 Ask flow, server-verified citations, `ask_logs`, quotas) and the Ask screen with source cards and the fewer-than-3-entries state |
| 13 | `add-settings-account` | Settings (account, today's usage, theme, privacy notice and policy link, sign out) and Delete Account via Edge Function `delete-account` |
| 14 | `add-demo-account` | "Try the demo" sign-in, about 20 seeded entries (`seed.sql`, `is_demo`), nightly reset via cron and `reset-demo` |
| 15 | `add-monitoring-e2e` | Sentry (free) and Maestro E2E flows for the core loop, run in CI |
| 16 | `add-daily-reminder` (Should) | Local daily notification and the reminder-time row in Settings |
| 17 | `add-app-lock` (Should) | Biometric gate when the app opens |
| 18 | `prepare-portfolio-release` | APK build, GitHub Releases, privacy policy on GitHub Pages, README with screenshots and demo video; recheck the "verify at implementation" list |

**Later, in order:**
1. `add-mood-insights`: mood chart and calendar grid. First after the MVP.
2. `add-ai-fallback-cloudflare`: Cloudflare Workers AI fallback when the Gemini quota runs out.
3. `add-offline-recording-queue`: record offline and upload automatically when back online.
4. `add-social-login`: Google and Apple sign-in, required before a store release.
5. `add-ask-chat`: multi-turn Ask.
6. `add-weekly-recap`: weekly AI summary.
7. `add-calendar-view`: calendar view for Journal.
8. `add-transcript-editing`: edit the transcript, then re-analyze.
9. `add-export`: export to Markdown/PDF.
10. `add-audio-auto-delete`: setting to auto-delete audio after processing.
11. `add-processing-push-notification`: push notification when an entry is ready.
12. `add-paywall-pro`: paywall and Pro tier (RevenueCat). Needs a store release and fees.
