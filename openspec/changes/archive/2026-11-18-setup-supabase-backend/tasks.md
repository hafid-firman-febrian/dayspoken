# Tasks

## 1. Branch and tooling

- [x] 1.1 Tick Proposed and Reviewed for entry 3 in ROADMAP.md, then create branch `feat/setup-supabase-backend` from an up-to-date `main`; verify with `git branch --show-current` and `git status` (clean apart from this change's files)
- [x] 1.2 Owner starts Docker Desktop; verify `docker info` answers without error
- [x] 1.3 Add `supabase` as an exact-version dev dependency (3.2.0, or 2.122.1 if 3.2.0 fails any command in this group) and verify `npx supabase --version` prints it and `package-lock.json` records it
- [x] 1.4 Run `npx supabase init` and set `project_id = "dayspoken"` and `[db.seed] enabled = false` in `supabase/config.toml` (auth and other defaults unchanged); verify `supabase/config.toml` and `supabase/.gitignore` exist and `git status` shows no `.temp` or `.env` file as untracked
- [x] 1.5 Add the npm scripts `db:start`, `db:stop`, `db:reset`, `db:test`, `db:smoke`, `db:types`, `db:types:check`, reading the option names from `npx supabase <command> --help` for the pinned version; verify `npm run db:start` prints the local URL, publishable key, and secret key, and that `npm run db:start` with Docker stopped fails with a message about the container runtime
- [x] 1.6 Exclude `supabase/functions/_shared/database.types.ts` from Prettier (`.prettierignore`) and ESLint (`eslint.config.js` ignores); verify `npm run lint` still passes with a dummy file of that name containing badly formatted code, then delete the dummy

## 2. Schema migrations and tests

- [x] 2.1 Migration 1: `vector` extension in the `extensions` schema and the enums `entry_status`, `embedding_status`, `mood_source`; verify `npm run db:reset` succeeds and `\dT` in `psql` (port 54322) lists all three with their values
- [x] 2.2 Migration 2: `plan_limits` with checks and the rows `free` 3/5, `pro` 10/50, `global` 100/200 (placeholders, commented as such in the SQL); verify with a pgTAP test `supabase/tests/database/plan_limits.test.sql` that the three rows and values exist and that a limit of -1 is rejected
- [x] 2.3 Migration 3: `profiles` (defaults, foreign keys, `check (plan <> 'global')`, timezone validation trigger) and `handle_new_user` on `auth.users`; verify with `profiles.test.sql`: profile created at sign-up with the defaults, unknown plan rejected, `global` rejected, `Asia/Jakarta` accepted and `Mars/Base` rejected
- [x] 2.4 Migration 4: `entries` with the capture, status, AI, embedding, and `search` columns, the `tags_are_valid` and tag-join helpers, all checks (duration 1 to 190, audio path, tags, mood pairing), the `updated_at` trigger using `clock_timestamp()`, the mood-source trigger, and the indexes (user and date, user and recorded time, GIN on `search`, HNSW cosine on `embedding`); verify with `entries.test.sql` covering every scenario in `specs/database-schema` for entries (defaults, bad status, bad path, duration 0 and 191, 6 tags, uppercase tag, mood 6, mood without source, search by transcript, title change, and tag, 768-dimension embedding accepted and 100 rejected, `updated_at` moves, cascade on user removal)
- [x] 2.5 Migration 5: `ask_logs` (citations default, array check, cascade, index on user and creation time); verify with `ask_logs.test.sql`: default empty list, an object instead of a list rejected
- [x] 2.6 If Postgres refuses the generated `search` expression, replace it with a `before insert or update` trigger and a plain `tsvector` column (design D7) and re-run `entries.test.sql`; skip this task when 2.4 passed as written, and record which path was taken in the migration comment
- [x] 2.7 Verify the whole group from empty: `npm run db:reset && npm run db:test` exits 0

## 3. Row-level security and grants

- [x] 3.1 Migration 6: enable RLS on `profiles`, `entries`, `ask_logs`, `plan_limits`; revoke all table rights from `anon` and `authenticated`; grant back only the rights and columns in design D5; add the policies (own rows, `status = 'ready'` for updates, `plan <> 'global'` for `plan_limits`); verify `npm run db:reset` succeeds
- [x] 3.2 Test `supabase/tests/database/rls_tables.test.sql`: every table in `public` has RLS enabled; `anon` has no privilege on any table; `authenticated` privileges match the D5 table exactly (read from `information_schema.column_privileges`), so a forgotten revoke fails
- [x] 3.3 Test `rls_entries.test.sql` with two users and role switching: A cannot see, change, or delete B's entries; A's insert with capture fields works; inserting a status, a transcript, or another user's id is refused; light edit on a ready entry works; editing an `analyzing` entry changes no row; a mood edit sets `mood_source` to `user`; editing `status`, `transcript`, `summary`, or `embedding` is refused; the server role can complete an entry and its AI mood keeps source `ai`
- [x] 3.4 Test `rls_profiles_ask_limits.test.sql`: timezone and reminder time editable, plan and `is_demo` refused, direct profile insert and delete refused; ask-log read and delete limited to the owner and insert refused; `plan_limits` returns `free` and `pro` but not `global`, and updates are refused; `anon` reads and writes nothing
- [x] 3.5 Mutation check: remove one policy and one `revoke` from migration 6 (one at a time), run `db:reset` and `db:test`, confirm a named test fails each time, restore, and confirm `db:test` is green again

## 4. Audio storage

- [x] 4.1 Migration 7: the `audio` bucket (`public = false`, 5 MB limit, the four audio types) and the `storage.objects` policies with the entry-id helper (design D11); verify `npm run db:reset` succeeds and `select * from storage.buckets` shows the bucket as designed
- [x] 4.2 Test `supabase/tests/database/storage_audio.test.sql`: bucket settings; A can insert `{A}/{entry}.m4a` for A's entry; refused for B's folder, for a wrong name (`notes.txt`, `.mp3`), for a missing entry, and for B's entry; A can select, replace, and delete only in their own folder; the server role can delete any file
- [x] 4.3 Mutation check on one storage policy (remove it, confirm the matching test fails, restore)

## 5. Ping, API checks, and generated types

- [x] 5.1 Migration 8: `public.ping()` returning `ok`, with `execute` revoked from `public` and granted to `anon` and `authenticated`; revoke `execute` from `anon`, `authenticated`, and `public` on `handle_new_user` and every other helper function from migrations 3 to 7; verify with `functions.test.sql`: exactly `ping` is executable by `anon`, and no helper is executable by `authenticated`
- [x] 5.2 Write `supabase/tests/api-check.sh` (reads URL and keys from `supabase status`, creates two users with the secret key, signs in with the publishable key) covering: valid upload accepted, 6 MB file and PNG refused, upload to the other user's folder refused, signed link (2 second expiry) works then fails, public URL refused, anonymous `GET /rest/v1/entries` returns no rows or an error, `ping` returns `ok` with only the `apikey` header; wire it as `npm run db:smoke`; verify it exits 0 on a reset database and non-zero when one check is made to fail on purpose (then undo)
- [x] 5.3 Generate `supabase/functions/_shared/database.types.ts` with `npm run db:types` and commit it; verify the file lists `entries` with the `status` union of five values and the `ping` function, and `npm run typecheck` passes
- [x] 5.4 Implement `db:types:check` (regenerate to a temp file and diff); verify it passes, then fails after a throwaway migration that adds a column, then passes again after regenerating (delete the throwaway migration afterwards)

## 6. App client and env

- [x] 6.1 Install `@supabase/supabase-js` and `react-native-url-polyfill` with `npx expo install` (versions chosen by Expo, `engines` checked against `.nvmrc`); verify `package.json` and the lockfile list them and `npm run typecheck` still passes
- [x] 6.2 Extend `src/lib/env.ts` and `src/lib/env.test.ts`: `supabase?: { url, publishableKey }` with the rules in `specs/app-env-config` (both or neither, `sb_publishable_` prefix, dedicated secret-key error that never contains the key, URL validity, `https` in production, key omitted when neither is set); verify `npm test -- src/lib/env.test.ts` passes, including the existing tests unchanged
- [x] 6.3 Update `.env.example` with both variables, local and cloud examples, and the `10.0.2.2` emulator note; verify every variable read in `env.ts` appears in the file (the existing documentation rule)
- [x] 6.4 Implement `src/lib/supabase.ts` (`createSupabaseClient(config)` and memoised `getSupabase()`, auth options all off, polyfill import, `Database` type from the generated file) and `src/lib/supabase.test.ts`; verify the tests cover same object on two calls, the clear error naming both variables, the options passed to `createClient`, and that a secret key never reaches `createClient`; verify `npm run lint` passes (if the import rules reject the type import from `supabase/`, add the one narrow exception and note it)
- [x] 6.5 Verify the app still starts with no Supabase variables: `npm run typecheck`, `npm run lint`, and `npm test -- --ci` pass with no `.env` file
- [x] 6.6 Device check on the Android emulator (as in `setup-design-system`): set the two variables for the local stack (`http://10.0.2.2:54321` and the local publishable key), add a temporary `getSupabase().rpc('ping')` call that logs the result, confirm `ok` in logcat and that reading `entries` returns no rows; then remove the temporary code and verify `git diff` shows none of it

## 7. Workflows

- [x] 7.1 Add `.github/workflows/database.yml` (path filter on `supabase/**`, `package-lock.json`, and the file; Node from `.nvmrc`; `npm ci`; start the stack; `db:reset`; `db:test`; `db:smoke`; `db:types:check`; stop) with no secrets and no `link`; verify the YAML parses (`npx --yes yaml valid` or the equivalent in the pinned toolchain) and, after the push in group 9, that the run on the pull request is green
- [x] 7.2 Add `.github/workflows/keep-alive.yml` (`schedule` at `17 5 * * *`, `workflow_dispatch`, `permissions: {}`, job guarded by `vars.SUPABASE_URL != ''`, `curl --fail --retry 3 --retry-all-errors --retry-delay 20` to `/rest/v1/rpc/ping` with the `apikey` header); verify by reading the file against `specs/keep-alive` (no `secrets.` reference, no permissions) and by running its curl line by hand against the local stack
- [x] 7.3 Dry run the guard: temporarily run the job's shell step with `SUPABASE_URL` empty and confirm the step is skipped with no failure (for example with `act` if installed, otherwise by reasoning from the `if:` condition and a manual run after group 8)

## 8. Cloud project (owner steps, agent guides each one in Indonesian)

- [x] 8.1 Owner confirms a free project slot and creates the project in the Supabase dashboard (region Southeast Asia (Singapore) unless the owner chooses another); verify the project shows as active on the Free plan and the owner has saved the database password
- [x] 8.2 Owner runs `npx supabase login` and `npx supabase link --project-ref <ref>` (password typed by the owner, never pasted into chat or a file); verify `npx supabase migration list --remote` shows the local migrations and none remote
- [x] 8.3 Owner runs `npx supabase db push --remote` (in CLI v3 `db` commands target the local stack unless `--remote` is given); verify `npx supabase migration list --remote` shows every migration on both sides, the dashboard shows the four tables with RLS on, the bucket `audio` as private, and the `vector` extension enabled
- [x] 8.4 Run the anonymous checks against the cloud project with the publishable key from the dashboard (table read returns no rows or an error, `ping` returns `ok`); verify both outputs
- [x] 8.5 Owner adds the repository variables `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (Settings, Secrets and variables, Actions, Variables tab) and starts the keep-alive workflow by hand from the Actions tab once it is on `main`; verify the run is green (after merge, see Workflow follow-up)

## 9. Documentation, ROADMAP, and final checks

- [x] 9.1 Update STRUCTURE.md: the `supabase/` layout (config, tests, generated types), the folder table, Config and secrets (new variables, publishable key, no secret in the app), Data and backend (bucket, grants and RLS rules, tests, types workflow, the one-command scripts), Testing (database tests, API checks, the two workflows), the CI paragraph (second workflow, path filter), and a Keep-alive section (daily ping, variables, 60-day rule, how to re-enable); verify each npm script and file name named there exists (`grep` each)
- [x] 9.2 Update `openspec/config.yaml` `context` (Stack line: publishable key, generated types location, local stack for development); verify `openspec validate --specs` still passes and the file still parses
- [x] 9.3 Run `npm run typecheck`, `npm run lint`, `npm test -- --ci`, `npm run db:reset`, `npm run db:test`, `npm run db:smoke`, and `npm run db:types:check`; verify all exit 0
- [x] 9.4 Fresh-clone check: clone the branch into a temporary folder with no `.env`, run `npm ci`, typecheck, lint, test, `db:start`, `db:test`, `db:smoke`; verify all pass and that `git grep -nE "sb_secret_|eyJ|password"` finds no real secret in the repository
- [x] 9.5 Tick Applied for entry 3 in ROADMAP.md, make Conventional Commits (no AI attribution, only the configured author), and push the branch; verify `git log --oneline main..HEAD` and that the remote branch matches
- [x] 9.6 Give the owner the pull request title and a ready-to-paste description (English); owner opens the pull request, waits for both workflows (`ci.yml` and `database.yml`) to be green, and merges; verify via the public GitHub API that the checks passed

## Workflow follow-up

- After the pull request is merged: switch to `main` and pull, run the keep-alive workflow once by hand (task 8.5), and confirm it is green.
- Archive the change with `openspec-archive-change` only after the merge, tick Archived in ROADMAP.md, commit `chore(openspec): archive setup-supabase-backend` on `main`, and push.
- Remember the 60-day rule: if the repository is quiet, re-enable the keep-alive workflow from the Actions tab.
