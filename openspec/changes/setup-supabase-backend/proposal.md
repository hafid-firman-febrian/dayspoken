# Proposal

## Why

Every feature after this one reads or writes data: sign-in (`add-email-otp-auth`), the capture pipeline (`add-ai-processing-pipeline`, `add-entry-capture-flow`), Home, Journal, Ask, Settings, and the demo account. None of them can start without a database, access rules, audio storage, a typed client, and a project that stays awake on the free plan. This change implements **ROADMAP.md entry 3, `setup-supabase-backend`**: the Supabase backend on the Free plan, with the safety rules (row-level security, a private audio bucket, public-only keys in the app) in place before any feature touches real data.

## What Changes

- **Tooling:** the Supabase CLI as a pinned dev dependency, a local stack (Docker) as the development database, and one cloud project on the Free plan as production. The schema changes only through timestamped SQL migrations in `supabase/migrations/`.
- **Database schema (migrations):**
  - `profiles`: created automatically when an auth user signs up.
  - `entries`: lifecycle status, AI fields, tags, a generated full-text search column (`'simple'` config), and an embedding column.
  - `ask_logs`.
  - `plan_limits`: per-plan limits plus the global daily caps, as configuration rows (free 3/5, pro 10/50).
- **Embedding size:** the model is `gemini-embedding-2` (the current stable Gemini embedding model, checked 2026-11-17), cut to **768 dimensions** (a size Google recommends, and under the 2000-dimension limit of an HNSW index on `vector`). The column is `vector(768)` with an HNSW cosine index.
- **Security:** row-level security on every table, least-privilege grants (users change only the columns they should), no public function callable by an anonymous visitor except a small `ping()`, and a trigger that marks a user-edited mood as `user`.
- **Audio storage:** a private bucket `audio`, objects at `{user_id}/{entry_id}.m4a`, owner-only access tied to an existing entry, size and type limits, and expiring signed URLs.
- **Generated types:** TypeScript types generated from the database into `supabase/functions/_shared/database.types.ts`, plus a check that they are not out of date. They are the single source of data types.
- **App client:** `src/lib/supabase.ts`, a typed client that uses only public values and does not persist sessions yet (secure session storage belongs to `add-email-otp-auth`).
- **Env:** two new public variables, `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The key must be a **publishable** key (`sb_publishable_...`): Supabase is retiring the old `anon` key by the end of 2026, and a secret key is rejected on purpose.
- **Tests:** pgTAP tests for the schema, the access rules, and the storage rules (`supabase/tests/database/`), run with one npm script. Jest tests for the env values and the client.
- **CI:** a new workflow `database.yml` that starts the local stack, replays every migration from empty, runs the pgTAP tests, and fails if the generated types are stale. It runs only when `supabase/**` (or this workflow) changes.
- **Keep-alive:** a scheduled GitHub Actions workflow `keep-alive.yml` that calls `ping()` once a day, so the free project is not paused after a week of low activity.
- **Cloud project:** the owner creates the Free project in the browser. The agent guides each step and deploys the same migrations with `supabase db push`.
- **Docs:** `STRUCTURE.md` and `openspec/config.yaml` are updated (see "Changes to agreed decisions"). `ROADMAP.md` gets its checkboxes ticked.

## Capabilities

### New Capabilities

- `database-schema`: the tables, columns, constraints, enums, indexes, search and embedding columns, automatic profile creation, `plan_limits` configuration, and cascade on account removal.
- `row-level-security`: who can read and write which rows and columns, and which functions can be called.
- `audio-storage`: the private audio bucket, object paths, owner-only access, limits, and signed URLs.
- `database-workflow`: the local stack, migrations, tests, generated types, and deployment to the cloud project.
- `supabase-client`: the typed app client, its configuration errors, and what it does not do yet.
- `keep-alive`: the scheduled ping that keeps the free project awake.

### Modified Capabilities

- `app-env-config`: adds the two Supabase variables and their validation (a requirement is added, no existing one changes).
- `continuous-integration`: adds the database checks workflow (a requirement is added, no existing one changes).

## Out of scope

- Auth screens, email OTP, SMTP, and secure session storage (`add-email-otp-auth`). The local `config.toml` keeps Supabase's auth defaults.
- Every Edge Function: `process-entry`, `ask`, `delete-account`, `reset-demo` (`add-ai-processing-pipeline`, `add-ask-journal`, `add-settings-account`, `add-demo-account`).
- Enforcing the daily quotas (checked in `process-entry` and `ask`). This change only stores the limits.
- Vector search functions (`match_entries` and similar) (`add-ask-journal`).
- Realtime on `entries` (`add-entry-capture-flow`).
- Seed data and the demo account (`add-demo-account`). `supabase/seed.sql` is not created.
- TanStack Query, `features/*/api.ts`, and any screen that reads data.
- Calling Gemini or any AI provider. The embedding model is only chosen here, to fix the column size.
- A second cloud project (staging). Development is the local stack.

## Cost impact

Rp 0. No paid service.
- **Supabase Free plan:** 500 MB database, 1 GB file storage, 50 MB per uploaded file, 5 GB egress, 2 active free projects (pricing page, 2026-11-17). The owner needs one free project slot.
- **GitHub Actions:** free for public repositories. The new workflows add minutes (database checks about 3 to 6 minutes when `supabase/**` changes, and a few seconds a day for the keep-alive).
- **Docker Desktop:** already installed, free for personal use.
- **Dependencies, all open source:** `supabase` (CLI, dev), `@supabase/supabase-js` (MIT), `react-native-url-polyfill` (MIT).

## Changes to agreed decisions

**No agreed product decision changes.** Details filled in or confirmed:
- **Keys:** the app uses a publishable key, not the legacy `anon` key (a Supabase platform change). `STRUCTURE.md` and `config.yaml` say "public `EXPO_PUBLIC_*` values", which still holds.
- **Embedding:** ROADMAP.md says the size "follows the Gemini embedding model; confirm the current model and its dimension". It is confirmed here: `gemini-embedding-2`, 768 dimensions. The two Gemini embedding models are not compatible with each other, so a later change of model means a new migration and re-embedding.
- **Global caps** live in `plan_limits` as a row named `global`, so the brief's "plan_limits ... plus the global daily caps" stays in one table. The starting numbers are placeholders for `add-ai-processing-pipeline` to tune after it checks the Gemini free-tier quotas.
- **Audio paths:** the bucket is `audio`, and the object name is `{user_id}/{entry_id}.m4a` (ROADMAP.md writes it as `audio/{user_id}/{entry_id}.m4a`).

**This change updates:**
- `STRUCTURE.md`: the `supabase/` layout (tests, config, generated types), Data and backend conventions, Config and secrets (the new variables), Testing (database tests), CI (the database workflow), and the Git workflow note about keep-alive.
- `openspec/config.yaml`: the `context` Stack line for the publishable key and the generated types location.
- `ROADMAP.md`: checkboxes only.

## Impact

- **New files:**
  - `supabase/config.toml`, `supabase/.gitignore`
  - `supabase/migrations/` (about 7 migrations)
  - `supabase/tests/database/` (pgTAP)
  - `supabase/functions/_shared/database.types.ts` (generated)
  - `src/lib/supabase.ts` and its test
  - `.github/workflows/database.yml`, `.github/workflows/keep-alive.yml`
- **Edited files:** `package.json` and `package-lock.json`, `src/lib/env.ts` and its test, `.env.example`, `.prettierignore`, `eslint.config.js`, `STRUCTURE.md`, `ROADMAP.md`, `openspec/config.yaml`.
- **Owner's machine:** Docker Desktop must be running to start the local stack. The owner runs `supabase login` and `supabase link` once (they need a browser and the database password).
- **Supabase and GitHub:** a new free cloud project, and two repository variables (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`) for the keep-alive.
- **Git:** branch `feat/setup-supabase-backend`, one pull request, and CI as before plus the database workflow when `supabase/**` changes.
