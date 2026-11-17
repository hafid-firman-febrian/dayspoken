# Design

## Context

- See `proposal.md` (Why, Out of scope, Cost impact). This is ROADMAP.md entry 3. The requirements are in `specs/`.
- The app currently has no backend code. `src/lib/env.ts` validates one variable (`EXPO_PUBLIC_APP_ENV`), ESLint forbids `process.env` outside it, and CI is one job (typecheck, lint, test).
- STRUCTURE.md already fixes where things live: `supabase/migrations/`, `supabase/functions/_shared/` (including "db types"), and the Supabase client in `src/lib/`.
- Development is the local stack (Docker Desktop is installed, the daemon is off on the owner's machine). Production is one cloud project on the Free plan.
- Supabase now issues **publishable** (`sb_publishable_...`) and **secret** (`sb_secret_...`) keys. The old `anon` and `service_role` JWT keys are being retired by the end of 2026. The local stack prints both kinds.

## Goals / Non-Goals

**Goals:**
- A schema that rejects bad data on its own, whatever client or Edge Function writes it.
- Access rules that are tested, not trusted: every rule in `row-level-security` and `audio-storage` has a test that fails if the rule is removed.
- One tool chain for every developer and for CI: pinned CLI, local stack, one npm script per task.
- The app can create a typed client with public values only, and still starts when it is not configured.

**Non-Goals:**
- Anything an Edge Function does: quota counting, calling Gemini, writing results, deleting audio of a removed account.
- Search functions (full-text ranking, vector matching). Only the columns and indexes they will use.
- Deleting the audio file when a user deletes one entry. Storage files must be removed through the Storage API (deleting `storage.objects` rows in SQL leaves the file behind), so the change that adds entry deletion owns it.
- Validating the content of `transcript`, `title`, `summary` (the Zod validation of model output is in the pipeline change).

## Decisions

### D1. The Supabase CLI is a pinned dev dependency, not a global tool
`supabase` goes in `devDependencies` with an exact version, and every command runs through an npm script. CI and every machine then use the same CLI, so generated types and migrations do not drift.
- **Version:** npm `latest` is 3.2.0 and `v2.stable` is 2.122.1 (2026-11-17). The owner's Homebrew copy is 2.120.0. Apply installs 3.2.0, and if `init`, `start`, `db reset`, `test db`, or `gen types` misbehave it falls back to 2.122.1. The exact version is recorded in `package.json`, not a range.
- **Alternative:** Homebrew only. Rejected: not reproducible in CI, and the version would differ per machine.
- **Scripts:** `db:start`, `db:stop`, `db:reset`, `db:test` (pgTAP), `db:smoke` (API checks), `db:types`, `db:types:check`. They are thin wrappers over `supabase ...`.
- **Applied:** 3.2.0 worked for every command, so the 2.122.1 fallback was not needed. In v3 the commands target the local stack by default (there is no `--local` flag; `--remote` selects the cloud).

### D2. Dev is the local stack, prod is the one cloud project
No staging project: the Free plan allows 2 active projects and the owner may need the second for something else. The local stack replays the same migrations, and `db:reset` rebuilds it from empty in seconds. Cloud receives migrations only through `supabase db push` (spec: `database-workflow`). No dashboard edits.
- **Config:** `supabase init` makes `supabase/config.toml`. Keep Supabase's defaults (auth stays as is, for `add-email-otp-auth`). Set `project_id = "dayspoken"` and turn the seed hook off (`[db.seed] enabled = false`) until `add-demo-account` adds `seed.sql`.
- **Ports:** the local ports are the defaults plus 100 (API 54421, database 54422, Studio 54423, mail 54424). Found at apply time: another Supabase project (`repmind`) was already running on the default 543xx ports on the owner's machine, so `supabase start` failed on port 54322. Moving this project's ports keeps both stacks usable together and touches nothing of the other project. The Android emulator URL is therefore `http://10.0.2.2:54421`.
- **Cloud link:** `supabase link` writes `supabase/.temp/` (git-ignored). The database password is typed by the owner and never written to a file, the chat, or a workflow.

### D3. Migrations: small files, one concern each
About eight timestamped files, in this order, so each one can be read and reverted alone:

1. extensions (`vector` in the `extensions` schema) and the three enums
2. `plan_limits` and its three seed rows
3. `profiles`, the timezone check, and the `handle_new_user` trigger on `auth.users`
4. `entries` (columns, constraints, generated search column, indexes, `updated_at` and mood-source triggers)
5. `ask_logs`
6. RLS: enable on every table, revoke everything, grant back only what the specs allow, policies
7. storage: the `audio` bucket and the `storage.objects` policies
8. `ping()`

Two pure helper functions used by the `entries` constraints (`tags_are_valid`, `tags_to_text`) live in a `private` schema that the API does not expose. Found at apply time: Postgres recomputes the generated `search` column with the caller's rights, so a signed-in user's update failed with "permission denied for function" while the helper was revoked. Moving the helpers to `private` and granting `execute` there to `authenticated` and `service_role` fixes it without making them callable as `/rpc` endpoints (the API check proves a 404).

Supabase creates default privileges that give `anon`, `authenticated`, and `service_role` full rights on every new `public` table and function. So migration 6 **revokes first and grants back** (and each new function revokes `execute` from `public`, `anon`, and `authenticated` before granting), instead of relying on RLS alone. A pgTAP test lists every table and function in `public` and checks this, so a later migration that forgets it fails the tests.

### D4. Native enums for status values
`entry_status` (5 values), `embedding_status` (3), and `mood_source` (2) are Postgres enums. The generated types then give exact unions (`'uploading' | 'transcribing' | ...`), which is the point of "types are the single source".
- **Alternative:** `text` plus a `check`. Types would be plain `string`. Rejected.
- **Cost:** removing or renaming an enum value is awkward in Postgres. Adding one is easy, and the lifecycle is stable, so this is acceptable.

### D5. Rights come from column grants plus RLS, not from "trust the client"
RLS decides which rows. Column grants decide which columns. Both are needed, because RLS alone cannot stop a user from setting `status = 'ready'` on their own row.

| Table | `authenticated` can | Columns |
|---|---|---|
| `profiles` | select, update | update only `timezone`, `reminder_time` |
| `entries` | select, insert, update, delete | insert `id, local_date, recorded_at, duration_sec, audio_path, prompt`; update `title, mood, tags` |
| `ask_logs` | select, delete | none written by users |
| `plan_limits` | select (rows where `plan <> 'global'`) | none |

- `entries.user_id` has the default `auth.uid()` and is not in the insert grant, so a user cannot name another owner. A policy `with check (user_id = (select auth.uid()))` still guards it.
- The update policy requires `status = 'ready'` (users edit finished entries only).
- `anon` gets no table rights at all. `service_role` keeps full rights (it also bypasses RLS).
- Policies use `(select auth.uid())` so the value is computed once per statement, not per row.
- A `before update` trigger sets `mood_source = 'user'` when `mood` changes **and** the caller is the `authenticated` role (`current_user = 'authenticated'`). The server role is not affected, so the pipeline can still write `ai`.
- **Alternative:** a security-definer RPC for every user write. Rejected: more code, and the generated types and PostgREST already cover plain column writes.

### D6. Embedding: `gemini-embedding-2` at 768 dimensions, HNSW cosine
- Verified 2026-11-17: `gemini-embedding-2` is stable, takes up to 8,192 tokens, supports 128 to 3072 dimensions (768, 1536, and 3072 are the recommended sizes), and is normalised for any size. It is on the free tier. `gemini-embedding-001` is the older text-only model (2,048 tokens). Their vector spaces are **not compatible**.
- pgvector (README): `vector` columns can hold 16,000 dimensions, but an HNSW or IVFFlat index on `vector` stops at 2,000 (a `halfvec` index at 4,000). The default 3072 would need `halfvec`, so 768 is the simple choice.
- 768 dimensions cost 768 × 4 bytes + 8 ≈ 3 KB per entry. Even at 10,000 entries that is about 30 MB plus the index, small against the 500 MB limit. One journal entry is short (up to 3 minutes of speech), so recall quality at 768 is enough.
- Index: `hnsw (embedding vector_cosine_ops)` with pgvector defaults (`m = 16`, `ef_construction = 64`, `hnsw.ef_search = 40`). Null embeddings are fine in an HNSW index.
- Changing the model or the size later means a new migration (new column or retyped column) and re-embedding every entry. `embedding_status` is how that backfill is tracked.
- **Alternative:** 1536 or 3072 with `halfvec`. Rejected: more storage and slower search for no visible gain at this size.
- Task input format (`task: search result | query: ...`, `title: ... | text: ...`) belongs to the AI adapter in `add-ai-processing-pipeline`.

### D7. Full-text search: a generated column over `simple`
`search tsvector generated always as (to_tsvector('simple', ...)) stored` over title, summary, transcript, and tags, with a GIN index. The `simple` configuration does no stemming and no stop words, which suits mixed languages. A generated column cannot call a function that is not `immutable`, and `array_to_string` is only `stable`, so a small `immutable` SQL wrapper joins the tags. If Postgres still refuses the expression, apply falls back to a `before insert or update` trigger that fills the column. The specs hold either way (the column stays in step with its sources).
- No weights yet (`setweight`). Ranking is the concern of the search change.

### D8. Checks that live in the database
- `duration_sec` between 1 and 190. The product limit is 3 minutes (180 s) and is enforced in the app (`MAX_RECORDING_SECONDS`). The extra 10 seconds absorbs the stop latency of the recorder, so a valid recording is never refused by the database.
- `audio_path = user_id || '/' || id || '.m4a'`, so a row can never point at another user's file.
- `tags`: an `immutable` SQL function `tags_are_valid(text[])` (at most 5 items, each non-empty and equal to its lowercase form), used in a `check`.
- `mood` 1 to 5, and `mood` and `mood_source` both set or both null.
- `citations jsonb not null default '[]'` with `check (jsonb_typeof(citations) = 'array')`. The shape of each item (`entry_id`, `quote`) is validated by Zod in the Ask function. The database checks only the container, because a stricter `check` on JSON is brittle.
- `timezone`: a `before insert or update` trigger tries `now() at time zone new.timezone` and raises if the name is unknown. A `check` cannot query `pg_timezone_names`. Without it a user could store a bad name through the API and break every server computation of `local_date`.
- `updated_at` uses `clock_timestamp()` (not `now()`), so two updates in one transaction still differ, which also makes the behaviour testable.

### D9. `plan_limits` is configuration with a `global` row
`plan` text primary key, `recordings_per_day int check (>= 0)`, `asks_per_day int check (>= 0)`. Rows: `free` 3/5, `pro` 10/50, and `global`. `profiles.plan` has a foreign key to `plan_limits(plan)` plus `check (plan <> 'global')`, so a user can never be on the global row. A select policy hides the `global` row from users.
- **Global numbers are placeholders** (recordings 100, asks 200) and the change that does the counting tunes them. The Gemini free-tier rate limits are not on the public pricing page, so they have to be read from the AI Studio quota page of the project at that time.
- **Alternative:** a second table for global caps. Rejected: the brief names one table, and one table keeps "all limits are configuration" true.

### D10. Profile creation: a trigger on `auth.users`
`handle_new_user()` is `security definer` with an empty `search_path`, inserts the profile, and has `execute` revoked from everyone. Users cannot insert a profile (no grant), so the trigger is the only way, and nobody ever has a user without a profile. `profiles.id` references `auth.users(id)` on delete cascade, and `entries.user_id` and `ask_logs.user_id` reference `profiles(id)` on delete cascade (spec: removing a user removes their data).

### D11. Storage: bucket by migration, rules by policy, limits by bucket
- The bucket row is inserted by a migration (`insert ... on conflict do update`), not by `config.toml`, because only migrations reach the cloud project. It sets `public = false`, `file_size_limit = 5 MB`, and `allowed_mime_types = audio/mp4, audio/x-m4a, audio/m4a, audio/aac`. At about 32 kbps, three minutes is about 0.7 MB, so 5 MB is generous headroom without letting a bad client fill the 1 GB quota in a few uploads.
- Policies on `storage.objects` for `authenticated`, all on `bucket_id = 'audio'`:
  - select and delete: the first folder equals the caller's id.
  - insert and update (with check): an `entries` row exists with `audio_path` equal to the object name and `user_id` equal to the caller. Because `entries.audio_path` is constrained to `{user_id}/{id}.m4a` (and is unique), this one condition proves the folder, the file name, and that the entry exists and is the caller's, with no parsing of the name and no helper function. The update policy also requires the caller's folder in its `using` part.
- Update is allowed with the same rule so an upload retry at the same path (`upsert`) works.
- **Size and type are enforced by the Storage API, not by SQL.** A pgTAP test can only read the bucket settings. The real refusals, the signed link expiry, and the public URL refusal are proved by the API check script (D13).
- **Signed URLs** need only the select policy. The app asks for a short expiry (the player change picks the number).

### D12. `ping()` is the one anonymous function
`public.ping()` returns the text `'ok'` and is `security invoker`. It touches nothing, but a call through the API is a database request, which is the activity the free plan counts. `execute` is revoked from `public` and granted to `anon` and `authenticated`. A pgTAP test lists every function in `public` that `anon` can execute and expects exactly `ping`.

### D13. Tests: pgTAP for SQL rules, a shell script for API rules
- **pgTAP** (`supabase/tests/database/*.test.sql`, run by `supabase test db`): constraints, defaults, triggers, grants, policies per role, bucket settings, and a "no table without RLS" check. Role switching uses `set local role` and `request.jwt.claims`. Each file creates its own users inside its transaction and rolls back, so no helper extension is added.
- **API check** (`supabase/tests/api-check.sh`, run by `db:smoke`): creates two users with the local secret key (admin API), signs them in, and calls the real HTTP endpoints: upload accepted, oversized and wrong-type refused, other user's folder refused, signed link works and then expires (a 2 second link and a short wait), public URL refused, anonymous table read refused, and `ping` returns `ok`. It reads the URL and keys from `supabase status`, so no key is stored. The same two anonymous checks (table refused, `ping`) run against the cloud project after the push, with the publishable key from the owner's shell.
- **Jest**: env parsing (both set, none, one missing, secret key refused and not echoed, `http` in production, non-URL) and the client (same object, clear error, options off, secret key never reaches `createClient`).
- **Mutation check in apply:** remove one policy or one revoke on purpose, confirm the right test fails, restore it (same method as in `setup-design-system`).

### D14. Generated types, committed
`supabase gen types typescript` writes `supabase/functions/_shared/database.types.ts` (through `scripts/db-types.sh`, which generates into a temporary file first so a failing CLI never truncates the committed one). The CLI v3 output is unformatted, so the script pipes it through Prettier (already a pinned dev dependency) to keep pull request diffs readable. The file is committed and excluded from Prettier and ESLint, and `db:types:check` regenerates into a temporary file and diffs it, which is what CI runs. Pinned CLI and Prettier (D1) keep the output stable.
- The app imports it with a type-only import in `src/lib/supabase.ts`. If the lint rules for imports (STRUCTURE.md "Imports") reject a path into `supabase/`, the fix is a narrow exception for that one file, noted in `STRUCTURE.md`, not a copy of the types.
- `vector` columns are generated as `string` (pgvector's text form). Code that reads an embedding is the server, so the app never sees it.
- Later changes add `Tables<'entries'>`-style aliases in their own `types.ts` files, not here.

### D15. The app client: a lazy, memoised factory
- `src/lib/supabase.ts` exports `getSupabase()`. A pure `createSupabaseClient(config)` builds the client (testable without the environment), and `getSupabase()` memoises one built from `env`. It is lazy so that the app, the tests, and CI work with no Supabase variables (spec: `supabase-client`).
- Options: `auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }`. A stored session needs secure storage (`expo-sqlite` localStorage or SecureStore), which belongs to `add-email-otp-auth`, so it is not added here.
- `react-native-url-polyfill/auto` is imported at the top of this file: React Native's `URL` is incomplete and supabase-js needs the full one.
- `env.ts` returns `supabase?: { url, publishableKey }`. When neither variable is set the key is **omitted** (not `undefined`), so the existing env tests that read the keys of the result keep passing. Validation: both or neither; key starts with `sb_publishable_`; a `sb_secret_` key gets a dedicated message; the error never contains the key; URL is `http(s)`, and `https` when `EXPO_PUBLIC_APP_ENV` is `production`.
- **Android emulator:** the host machine is `10.0.2.2`, not `127.0.0.1`. A debug build allows plain `http`, a release build does not, which matches the production `https` rule.

### D16. Keep-alive: one daily request through the public API
`.github/workflows/keep-alive.yml`: `on: schedule` (cron `17 5 * * *`, not at the top of the hour because GitHub drops or delays runs under load at those times) and `workflow_dispatch`. It has `permissions: {}`, and one job with `if: vars.SUPABASE_URL != ''` that calls `POST {url}/rest/v1/rpc/ping` with the `apikey` header and `curl --fail --retry 3 --retry-all-errors --retry-delay 20`. The URL and the publishable key are repository **variables** (they are public values, as in the app), so the workflow uses no secret.
- A failed run makes GitHub email the repository owner, which is also how a paused project would be noticed.
- GitHub switches scheduled workflows off after 60 days without repository activity in a public repository. The owner re-enables it from the Actions tab (or any commit that touches the workflow). This is documented in STRUCTURE.md (spec: `keep-alive`) and listed in the owner steps.
- **Alternatives:** an external pinger (a new service to trust and an account), or a Supabase `pg_cron` job (runs inside the database, so it does not count as an outside request and does not help once the project is already paused). Rejected.

### D17. CI: a second workflow, path-filtered
`.github/workflows/database.yml` runs on pull requests and pushes to `main` that touch `supabase/**`, `package-lock.json`, or itself. Steps: checkout, Node from `.nvmrc`, `npm ci`, `npx supabase start -x studio,mailpit,logflare,vector,edge-runtime,realtime,imgproxy,supavisor` (only the services the checks need; the same sequence was run locally and passes in about a minute), `db:reset`, `db:test`, `db:smoke`, `db:types:check`, then `supabase stop`. GitHub's hosted Ubuntu runners include Docker. The existing `ci.yml` is not changed, so frontend-only pull requests stay fast. The jobs do not run `supabase link`, so there is no token, password, or cloud call (spec: `continuous-integration`).
- **Trade-off:** a path-filtered workflow cannot be a "required" check in GitHub without also running on every pull request. Branch protection is not configured today (the owner checks CI by eye), so this is accepted. If it is made required later, the filter has to move into the job.

## Risks / Trade-offs

- **Storage fills before the database does.** 1 GB at about 0.7 MB per 3-minute recording is roughly 1,400 recordings for the whole app. → The global daily cap (D9) limits growth, the 5 MB bucket limit stops a runaway client, and capture compresses to 32 kbps mono. A retention rule is a later decision.
- **Free-tier Gemini content may be used by Google.** On the pricing page, free-tier embedding and text calls are marked "Used to improve our products: Yes". Journal text is private. → Not decided here (no AI call is made in this change). The pipeline change must decide between accepting that for a portfolio app and a user-facing notice, and the privacy policy must say it. Flagged to the owner.
- **The project can still pause.** The Free plan pauses after 7 days of low activity, and a scheduled workflow can be delayed or switched off. → Daily ping, retries, a visible failure, the 60-day rule documented, and Supabase's own warning email about a week before a pause. A paused project is restorable for up to a year.
- **Key rename.** The `anon` key is being retired, and docs and older tutorials still show it. → The env module refuses anything but `sb_publishable_...`, with a message that names the prefix.
- **CLI major version.** v3 is new to this project. → Exact pin, a fallback to 2.122.1 (D1), and CI runs every command on every `supabase/**` change.
- **Policy mistakes are silent.** A wrong policy returns no rows instead of an error. → Per-role pgTAP tests, a "no table without RLS" test, a grants test, and a mutation check (D13).
- **`vector` and `storage` internals.** The Storage schema is managed by Supabase and can change. → Policies use only the documented helper `storage.foldername` and the columns `bucket_id` and `name`; the API check proves the behaviour end to end.
- **Unvalidated JSON content** in `citations`. → Container checked in SQL, items by Zod at the writer (the Ask function, the only writer).
- **Android release builds refuse plain `http`.** → Production uses the `https` cloud URL, and the env module enforces it.
- **A shared free quota with another project.** The Free plan allows 2 active projects. → The owner confirms a free slot before creating the project (an owner step in tasks).

## Migration Plan

1. Branch `feat/setup-supabase-backend` from `main`. Tick Proposed and Reviewed in ROADMAP.md (apply guidance).
2. Local first: start Docker, add the CLI, `supabase init`, write migrations, run `db:reset`, `db:test`, `db:smoke`, `db:types` until green. Then the app side (env, client) and the CI and keep-alive workflows.
3. Owner steps (browser and terminal), each explained in plain Indonesian by the agent:
   1. Create the Free project in the Supabase dashboard (suggested region: Southeast Asia (Singapore), the closest to Indonesia) and note the database password in a password manager.
   2. `supabase login` and `supabase link --project-ref <ref>` (typed with `! ` in the session so the owner enters the password).
   3. `supabase db push`, then confirm the migration list matches.
   4. Run the two anonymous checks against the cloud project (table refused, `ping` returns `ok`).
   5. Add the repository variables `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, then start the keep-alive workflow once by hand.
4. Commit in small Conventional Commits, push, and the owner opens the pull request. The path-filtered database workflow and `ci.yml` must be green before the owner merges.
5. **Rollback:** the local database is disposable (`db:reset`). For the cloud project, a migration that was pushed and is wrong is fixed by a new migration, never by editing an applied file. While the cloud database holds no real data, the owner may also reset it from the dashboard. Removing the keep-alive is deleting its workflow file.

## Free-tier facts to verify during apply

- Supabase Free plan: 500 MB database, 1 GB file storage, 50 MB maximum upload, 5 GB egress, 2 active free projects, pause after 7 days of low activity (checked 2026-11-17 on the pricing, billing FAQ, and pause-policy pages). Re-check on the dashboard of the new project (the usage page).
- `vector` is available on the Free plan: confirmed when `supabase db push` creates the extension on the cloud project.
- A REST call with only the publishable key in the `apikey` header reaches `rpc/ping`: confirmed on the local stack, then on the cloud project.
- `supabase start` and `supabase gen types` option names for the pinned CLI version (service exclusion, local flag): read from `--help` of that version, not assumed.
- GitHub Actions: scheduled workflows run on the default branch only, are switched off after 60 days without repository activity in a public repository, and can be delayed or dropped under load (checked 2026-11-17 in the GitHub docs).
- Gemini: `gemini-embedding-2` and `gemini-embedding-001` are free of charge on the free tier (checked 2026-11-17), with free-tier content "used to improve our products". Free-tier rate limits are not on the pricing page and stay unknown until the pipeline change reads the project's quota page.

## Open Questions

- **Cloud region.** Singapore is suggested. The owner confirms it when creating the project. It changes no spec, task, or approach (the region cannot be changed later without a new project, which is cheap while the database is empty).
- **Exact `supabase` version** (3.2.0 or the 2.122.1 fallback): decided by the first apply run (D1), recorded in `package.json`.
