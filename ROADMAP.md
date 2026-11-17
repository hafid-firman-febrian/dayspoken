# Dayspoken: Roadmap

This file lists the agreed OpenSpec changes in order. For each change it tracks progress and gives the prompt that starts it.

- Fundamentals come before features, and the design system comes before any feature screen.
- Each change is small: about 1–3 days of work.
- Structure and conventions live in [`STRUCTURE.md`](STRUCTURE.md). Project-wide constraints live in [`openspec/config.yaml`](openspec/config.yaml).

## How to use

1. Pick the first change whose **Archived** box is not ticked.
2. Copy its propose prompt into a new session to create the change (`/openspec-propose …`).
3. Read the generated artifacts (proposal, specs, design, tasks).
4. Ask the agent to apply the change.
5. After the pull request is merged, ask the agent to archive the change.

## Checkbox legend

| Box | Meaning | Ticked when |
|---|---|---|
| Proposed | All planning artifacts of the change exist | At the start of apply |
| Reviewed | The user has read the artifacts and wants to build them | At the start of apply. The request to apply is the approval; if unsure, the agent asks |
| Applied | Every task in `tasks.md` is checked and the checks (typecheck, lint, tests) pass | At the end of apply |
| Archived | The change is archived with `openspec archive` | During the archive run |

## Change flow

```
OpenSpec change -> branch -> implement + commits -> push -> PR + green CI -> merge -> archive change
```

`project-blueprint` (change 0) is the exception. It has no branch, PR, or commit. Its files are committed as the initial commit at the start of `setup-project-foundation`.

## MVP

### 0. project-blueprint

- [x] Proposed
- [x] Reviewed
- [x] Applied
- [x] Archived

**Scope:** capture the explore-session decisions as `STRUCTURE.md`, `ROADMAP.md`, and `openspec/config.yaml`. No app code.

```text
/openspec-propose project-blueprint: Turn the decisions from our explore session into project files: STRUCTURE.md (folder layout, conventions, data flow), ROADMAP.md (the agreed changes in order, each with Proposed/Reviewed/Applied/Archived checkboxes and its propose prompt), and openspec/config.yaml (context: app summary, stack, structure rules; rules for proposal/design/tasks; apply/archive guidance including ticking ROADMAP.md). Use only what we decided. No app code yet.

Out of scope: any app code, dependencies, Expo or Supabase setup (setup-project-foundation and later).
```

### 1. setup-project-foundation

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** Expo app scaffold, folder structure, lint and test setup, GitHub repository with CI, and the user's first guided pull request.

```text
/openspec-propose setup-project-foundation: Scaffold the Dayspoken app.
- Start by committing the blueprint files (STRUCTURE.md, ROADMAP.md, openspec/) as the initial commit on main.
- Expo SDK (latest stable at setup), TypeScript strict, Expo Router, and a development build (expo-dev-client). Use npm.
- Create the folder structure from STRUCTURE.md (app/, src/features/, src/ui/, src/theme/, src/lib/, src/utils/, supabase/, e2e/, docs/), limited to what this change needs.
- ESLint + Prettier, and Jest with React Native Testing Library.
- Env config with public EXPO_PUBLIC_* values only.
- Create the GitHub repository (the user runs `gh auth login` once). Ask the user whether it should be public or private.
- Add a GitHub Actions CI workflow that runs typecheck, lint, and tests.
- Deliver this change as the user's first pull request: work on feat/setup-project-foundation, use Conventional Commits, and explain every git/gh step (branch, commit, push, PR, CI, merge) in plain Indonesian, because the user is new to pull requests.

Out of scope: NativeWind, theme and UI components (setup-design-system); Supabase (setup-supabase-backend); any feature screen.
```

### 2. setup-design-system

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** NativeWind with the Tomato semantic tokens (light/dark), Geist, theme mode, every base UI component, and a dev-only component gallery.

```text
/openspec-propose setup-design-system: Add the Dayspoken design system.

Direction: "Mono + Mood". Neutral UI, bold tight sans-serif headings, rounded cards, mood colors that carry meaning. Do not use the rejected "Warm Journal" look (cream paper, serif, terracotta).

Styling: NativeWind with semantic tokens defined once per mode in src/theme. Use class names like bg-background, bg-surface, text-foreground, text-muted, border-border, bg-primary. No hex values in components. Check NativeWind vs Expo SDK compatibility.

Palette "Tomato" (light / dark):
- background: #F8F6F5 / #100A09
- surface: #FFFFFF / #1B1312
- foreground: #1A1210 / #FBF3F1
- muted: #6E6460 / #B09E99
- border: #ECE6E3 / #2D2120
- primary (Today card): #CC3F27 / #CC3F27
- on-primary: #FFFFFF / #FFFFFF
- record button (FAB): #CC3F27 with a white icon / #E8573C with a #1A0603 icon
- accent (streak, links): #CC3F27 / #FB8A6E

Today card: text on the card is white. The mic button is white with a #CC3F27 icon.

Record screen (always dark):
- background #100A09
- VoiceOrb gradient #FFFFFF -> #FDC8B8 -> #E8664C -> #7A2213
- Finish button #E8573C with a white square
- progress bar #FB8A6E

Mood scale tokens: 1 Rough #6366F1, 2 Low #0EA5E9, 3 Okay #A8A29E, 4 Good #10B981, 5 Great #FBBF24. A mood is never shown by color alone; it always has its label.

Typography: Geist for everything (check availability for expo-font).
- display 38/700, tight tracking
- title 27/600
- heading 18/600
- body 16
- reading 17, line-height 1.6
- caption 12-13/500

Spacing: 4pt grid, screen padding 20.
Radius: card 22, hero card 30. Buttons and chips are pills.
Icons: Lucide. Text contrast must be at least 4.5:1.

Theme mode: follows the system, with a manual override (system / light / dark) persisted in MMKV.

Base UI components in src/ui, each with component tests: Screen, Text (Geist variants), Button, IconButton, TextField, CodeInput, Card, Chip, BottomSheet (@gorhom/bottom-sheet), Dialog, Toast, EmptyState, ErrorState, Banner, Skeleton, SectionHeader, Icon.

Add a dev-only component gallery screen that shows every base component in light and dark.

Out of scope: feature UI such as FloatingTabBar, TodayCard, WeekMoodStrip, VoiceOrb (their feature changes); Supabase (setup-supabase-backend); real screens.
```

### 3. setup-supabase-backend

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** Supabase project (local and cloud), migrations, RLS, private audio bucket, generated types, app client, and the keep-alive ping.

```text
/openspec-propose setup-supabase-backend: Set up the Supabase backend on the Free plan.

Tooling: the Supabase CLI with a local stack and a cloud project. Timestamped SQL migrations in supabase/migrations. Generate TypeScript types from the database; they are the single source of data types.

Tables:
- profiles: id (= auth.users.id), timezone, plan (default 'free'), is_demo, reminder_time, created_at.
- entries: id, user_id, local_date (the user's day from the device timezone at recording time), recorded_at, duration_sec, audio_path, language, prompt.
  - status: uploading | transcribing | analyzing | ready | failed, plus error_code.
  - AI fields: transcript, title, summary, mood (1-5), mood_source (ai | user), tags (text[], lowercase, max 5).
  - embedding: pgvector, one vector per entry from transcript + summary. Its size follows the Gemini embedding model; confirm the current model and its dimension.
  - embedding_status: pending | ready | failed.
  - search: generated tsvector over title, summary, transcript, tags with the 'simple' config.
  - created_at, updated_at.
- ask_logs: id, user_id, local_date, question, answer, citations (JSON list of {entry_id, quote}), created_at.
- plan_limits: recordings_per_day and asks_per_day per plan (free 3/5, pro 10/50), plus the global daily caps for the whole app.

Security: RLS on every table, so users only see their own rows.

Storage: a private bucket for audio at audio/{user_id}/{entry_id}.m4a, played back through expiring signed URLs.

App: a Supabase client in src/lib that uses only public EXPO_PUBLIC_* values.

Keep-alive: a scheduled GitHub Actions ping so the free project does not pause. Check the current Supabase Free pause policy.

Out of scope: auth screens and SMTP (add-email-otp-auth); Edge Functions (add-ai-processing-pipeline, add-ask-journal, add-settings-account, add-demo-account); seed data (add-demo-account).
```

### 4. add-email-otp-auth

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** Welcome, Sign In, and Verify Code screens with Supabase email OTP through free SMTP, a secure session, a routing guard, and sign out.

```text
/openspec-propose add-email-otp-auth: Add email OTP sign-in.

Screens:
- S01 Welcome: value proposition, "Get started", a "Try the demo" button (a placeholder until add-demo-account), and the privacy notice that audio is processed by Google Gemini's free tier. Suggested copy: "This demo processes audio with Google Gemini's free tier. Avoid recording sensitive information."
- S02 Sign In: email input, with invalid-email and loading states.
- S03 Verify Code: 6-digit CodeInput and resend with a timer, with wrong-code and expired-code states.

Backend: Supabase Auth email OTP delivered through free SMTP (Gmail app password or Brevo), because Supabase's built-in email is for testing only. Check the current Supabase SMTP limits.

Also: store the session securely, add a routing guard between (auth) and the app, and add sign out.

Use src/ui components and semantic tokens. UI copy is in English.

Out of scope: tab shell (add-app-shell-navigation); demo sign-in (add-demo-account); Settings (add-settings-account); Google/Apple sign-in (Later: add-social-login).
```

### 5. add-app-shell-navigation

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** floating pill tab bar with a center record button, placeholder tab screens, and the modal and detail routes.

```text
/openspec-propose add-app-shell-navigation: Build the app shell with Expo Router.
- (tabs) layout with the FloatingTabBar: a floating pill tab bar with Home, Journal, Ask, Settings, and a raised center record button that opens the Record modal from any tab. Colors come from the design-system tokens.
- Placeholder screens for each tab.
- Routes: app/record.tsx (full-screen modal), app/processing/[id].tsx, app/entry/[id].tsx, app/delete-account.tsx.

Follow STRUCTURE.md for routes and features.

Out of scope: real screen content (later changes); recording (add-audio-recording).
```

### 6. add-audio-recording

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** the Record screen with a permission primer, optional prompt, timer, pause/resume, length limits, metering, VoiceOrb, and controls. The local file is kept.

```text
/openspec-propose add-audio-recording: Build the Record screen (S08). It is a full-screen modal and always dark.

Permissions:
- A mic permission primer is shown before the OS dialog the first time.
- A permission-denied state.

Prompt: one optional random prompt the user may ignore (for example "What stood out today?").

Recording with expo-audio:
- A timer, with pause and resume.
- Minimum about 10 seconds, with a "too short" state.
- Maximum 3:00, with a warning at 2:30, then auto-stop.
- Metering for the waveform.

VoiceOrb: a breathing animation built with Reanimated + react-native-skia. It uses the Record palette from the design system: background #100A09, orb gradient #FFFFFF -> #FDC8B8 -> #E8664C -> #7A2213, Finish button #E8573C with a white square, progress bar #FB8A6E.

Controls: Discard / Finish / Pause.

Keep the recorded file on the device for the capture flow (MMKV tracks audio waiting to upload). UI copy is in English.

Out of scope: upload, entry creation, and the Processing screen (add-entry-capture-flow); AI (add-ai-processing-pipeline).
```

### 7. add-ai-processing-pipeline

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** the Edge Function `process-entry` with the AI adapter (Gemini), transcription, analysis, embedding, quotas, error codes, idempotent retry, and Deno tests.

```text
/openspec-propose add-ai-processing-pipeline: Build the Supabase Edge Function process-entry (Deno).

1. Check quotas first:
   - per user per local_date against plan_limits (free: 3 recordings per day)
   - the global daily cap for the whole app
   - if either is reached, return the stable error code QUOTA_EXCEEDED
2. Reply "accepted" and continue in the background, updating entries.status:
   1. transcribing: transcript and detected language
   2. analyzing: title, summary, mood 1-5, tags (max 5, lowercase), written in the language that was spoken; JSON validated with Zod, one retry if invalid
   3. embedding: one vector per entry from transcript + summary; on failure set embedding_status to pending without failing the entry
   4. ready, or failed with a stable error code (for example TRANSCRIPTION_FAILED)
3. The function is idempotent, so retry calls it again.

AI adapter:
- Every AI call goes through supabase/functions/_shared/ai-adapter/.
- It is configured per environment: the provider, plus a model per task (process-entry and ask separately).
- The provider is the Gemini API free tier (Flash models).
- Keys are Supabase secrets only. Development and production use separate Google projects.
- Embeddings always come from one model.
- The app never calls AI providers.

In design, decide whether transcription and analysis are one call or two, keeping the transcribing and analyzing statuses meaningful. Check the current Gemini free-tier quotas and data terms.

Write Deno tests for the function, the adapter, the quota checks, and the validation.

Out of scope: app upload and the Processing UI (add-entry-capture-flow); Ask (add-ask-journal); the Cloudflare fallback (Later: add-ai-fallback-cloudflare).
```

### 8. add-entry-capture-flow

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** compress and upload audio, create the entry, the Processing screen with Realtime status, retry, local audio safety, and the offline banner.

```text
/openspec-propose add-entry-capture-flow: Connect recording to the pipeline.

After Finish:
1. Compress the audio to about 32 kbps mono (around 0.7 MB per 3 minutes).
2. Create the entry: status uploading, local_date from the device timezone, recorded_at, duration_sec, prompt.
3. Upload to audio/{user_id}/{entry_id}.m4a.
4. Call process-entry.

Processing screen (S09):
- The stepper Uploading -> Transcribing -> Analyzing is driven by Realtime on the entry row. Enable Realtime for entries.
- "Continue in background".
- A failed state with retry, which calls process-entry again.

Local audio stays on the device until its upload succeeds.

Connectivity: recording requires a connection. Show an offline banner; already-loaded data stays readable from the TanStack Query cache.

Quota-reached states (per user and global) show a friendly message ("Demo quota reached for today").

Out of scope: Home, Journal, and Entry Detail screens (later changes); the offline recording queue (Later: add-offline-recording-queue).
```

### 9. add-home-screen

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** Home with the streak, week mood strip, Today card with remaining quota, recent entries, and empty states.

```text
/openspec-propose add-home-screen: Build Home (S04) in the "Mono + Mood" layout.
- Date and a StreakBadge chip. The streak counts days with at least one entry, by local_date.
- The headline greeting ("Good evening.").
- A 7-day WeekMoodStrip in mood colors with labels; today is drawn as a dashed ring.
- The TodayCard hero on primary: "Today's prompt", the prompt, "Up to 3 min · any language", a round mic button that opens Record, and the remaining recordings for today.
- "Recent" EntryCards (date, duration, MoodChip, title, summary) that open Entry Detail.
- States: no entries yet, entry processing, loading, error, offline.

Out of scope: the Journal list (add-journal-search); mood insights (Later: add-mood-insights).
```

### 10. add-entry-detail

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** audio playback via signed URL, summary, transcript, the Edit Entry sheet, and delete with confirmation.

```text
/openspec-propose add-entry-detail: Build Entry Detail (S10).
- Content: date, title, MoodChip, summary, tags, an AudioPlayer that plays through an expiring signed URL, and the transcript in the reading style (17, line-height 1.6).
- States: processing, and failed with retry.

Edit Entry bottom sheet (S11):
- title
- MoodPicker, which sets mood_source = user
- tag editor (lowercase, max 5)

Delete: a confirmation Dialog, then remove the entry and its audio file.

Out of scope: transcript editing (Later: add-transcript-editing); export (Later: add-export).
```

### 11. add-journal-search

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** the Journal list grouped by day with sticky headers, pagination, keyword search, and the Filter sheet.

```text
/openspec-propose add-journal-search: Build Journal (S05).
- Entries grouped by local_date with sticky SectionHeader dates, paginated.
- A search bar using keyword full-text search on the entries search column ('simple' config).
- Filter chips and the Filter bottom sheet (S12) for mood and tags.
- States: empty, no results, skeleton loading, error, offline.

Out of scope: Ask (add-ask-journal); calendar view (Later: add-calendar-view).
```

### 12. add-ask-journal

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** the Edge Function `ask` with server-verified citations and the Ask screen with source cards.

```text
/openspec-propose add-ask-journal: Build Ask.

Edge Function ask (Deno, with Deno tests):
1. Check the quota: free is 5 questions per user per local_date, plus the global daily cap. Return QUOTA_EXCEEDED when reached.
2. Embed the question.
3. Run a pgvector similarity search within the user's own entries (embedding_status = ready).
4. Send the matches to the model with their dates, ordered by time. Recency matters for questions like "When was I last stressed about work?".
5. The model, called through the AI adapter (Gemini free tier) and validated with Zod, returns an answer plus {entry_id, quote} citations.
6. The server verifies each quote exists in that entry's transcript. Decide in design how unverified citations are handled.
7. Save question, answer, and citations to ask_logs.

Ask screen (S06):
- A question input and example questions.
- The answer with CitationCards that open Entry Detail.
- States: fewer than 3 entries ("Ask works best after a few entries"), loading, quota reached, error, offline.
- One question and one answer only; no history screen.

Out of scope: Ask as chat (Later: add-ask-chat); weekly recap (Later: add-weekly-recap).
```

### 13. add-settings-account

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** Settings with account, usage, theme, privacy, and sign out, plus Delete Account through the Edge Function `delete-account`.

```text
/openspec-propose add-settings-account: Build Settings (S07).
- Account email.
- Today's usage: recordings and questions left.
- Theme: system / light / dark.
- The privacy notice, with a link to the privacy policy page.
- Sign out.

Delete Account (S13):
- Explain the consequences, and ask the user to type "DELETE" to confirm.
- Loading and error states.
- Call the Edge Function delete-account, which removes the user's audio folder and the auth user. Their rows cascade.

Out of scope: reminder time (add-daily-reminder); app lock (add-app-lock); the privacy policy page itself (prepare-portfolio-release).
```

### 14. add-demo-account

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** "Try the demo" sign-in, about 20 seeded entries, and a nightly reset.

```text
/openspec-propose add-demo-account: Make "Try the demo" on Welcome work.
- It signs into a demo account (profiles.is_demo = true) without email OTP, so Upwork clients can try the app without signing up.
- Seed about 20 realistic entries in supabase/seed.sql so Home, Journal, and Ask look alive. Seeded entries need transcripts, analysis, and embeddings so Ask works; decide in design how the embeddings are produced.
- Reset the demo data every night with Supabase cron and the Edge Function reset-demo.
- Decide in design how quotas apply to the shared demo account. The global daily cap must keep protecting the free AI quota.

Out of scope: Settings (add-settings-account); monitoring and E2E (add-monitoring-e2e).
```

### 15. add-monitoring-e2e

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** Sentry (free) and Maestro E2E flows for the core loop, run in CI.

```text
/openspec-propose add-monitoring-e2e: Add monitoring and end-to-end tests.
- Sentry (free plan) for crashes and errors in the app.
- Maestro E2E flows in e2e/ for the core loop: sign in or demo -> record -> processing -> entry detail; Journal search; Ask.
- Run the flows in GitHub Actions CI.

Out of scope: daily reminder (add-daily-reminder); release build (prepare-portfolio-release).
```

### 16. add-daily-reminder (Should)

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** a local daily notification and the reminder-time row in Settings.

```text
/openspec-propose add-daily-reminder: Add a daily reminder with expo-notifications.
- A local notification, not a server push.
- A reminder-time row in Settings, stored in profiles.reminder_time.
- Notification permission handling.

Out of scope: server push notifications (Later: add-processing-push-notification); app lock (add-app-lock).
```

### 17. add-app-lock (Should)

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** a biometric gate when the app opens.

```text
/openspec-propose add-app-lock: Add the App Lock gate (S14) with expo-local-authentication.
- Biometric unlock when the app opens.

Out of scope: daily reminder (add-daily-reminder); release (prepare-portfolio-release).
```

### 18. prepare-portfolio-release

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

**Scope:** APK build, GitHub Releases, privacy policy on GitHub Pages, and a README with screenshots and a demo video. Recheck the "verify at implementation" list.

```text
/openspec-propose prepare-portfolio-release: Prepare the Rp 0 portfolio release.
- An Android APK, built with the EAS Build free tier or locally (check current EAS limits), published on GitHub Releases.
- The privacy policy page on GitHub Pages from docs/. It explains that audio is processed by Google Gemini's free tier.
- A README in English: what Dayspoken is, the stack, the architecture, screenshots, and a demo video (iOS shown in the video only).
- Recheck every item of the "verify at implementation time" list in openspec/config.yaml against official pages.

Out of scope: store submission (Play $25, Apple $99/year); Google/Apple sign-in (Later: add-social-login).
```

## Later

These come after the MVP, in this order.

### L1. add-mood-insights

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

```text
/openspec-propose add-mood-insights: Add mood insights: a mood chart and a calendar grid of daily moods. This is the first change after the MVP.
```

### L2. add-ai-fallback-cloudflare

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

```text
/openspec-propose add-ai-fallback-cloudflare: Add Cloudflare Workers AI as a fallback provider in the AI adapter, used when the Gemini free quota runs out. Check the Workers AI free daily quota and per-model costs. Embeddings must stay on one model.
```

### L3. add-offline-recording-queue

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

```text
/openspec-propose add-offline-recording-queue: Allow recording while offline and upload automatically when the connection is back.
```

### L4. add-social-login

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

```text
/openspec-propose add-social-login: Add Google and Apple sign-in. This is required before a store release.
```

### L5. add-ask-chat

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

```text
/openspec-propose add-ask-chat: Turn Ask into a multi-turn chat, building on ask_logs.
```

### L6. add-weekly-recap

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

```text
/openspec-propose add-weekly-recap: Add a weekly AI summary of the user's entries.
```

### L7. add-calendar-view

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

```text
/openspec-propose add-calendar-view: Add a calendar view to Journal.
```

### L8. add-transcript-editing

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

```text
/openspec-propose add-transcript-editing: Let users edit an entry's transcript and then re-run the analysis.
```

### L9. add-export

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

```text
/openspec-propose add-export: Export entries to Markdown or PDF.
```

### L10. add-audio-auto-delete

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

```text
/openspec-propose add-audio-auto-delete: Add a setting that deletes audio automatically after processing.
```

### L11. add-processing-push-notification

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

```text
/openspec-propose add-processing-push-notification: Send a push notification when an entry is ready.
```

### L12. add-paywall-pro

- [ ] Proposed
- [ ] Reviewed
- [ ] Applied
- [ ] Archived

```text
/openspec-propose add-paywall-pro: Add a paywall and a Pro tier (RevenueCat): 10 recordings and 50 questions per day, insights, export, and Ask chat. This needs a store release and its fees.
```
