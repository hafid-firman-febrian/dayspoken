# Tasks

**How to work through these tasks:**
- Before every `git` command and every browser step on GitHub, explain it to the owner in plain Indonesian, as described in design D13. The owner does the GitHub steps in the browser; the agent runs local `git` (design D11).
- Each group ends with its own commit. That commit includes the `tasks.md` checkboxes ticked so far.
- Check the staged files (`git diff --cached --name-only`) before every commit.

## 1. Initial commit on `main`

Do this group before ticking anything in `ROADMAP.md`.

- [x] 1.1 Explain what a repository, a commit, and `main` are. Then create `.gitignore` with `/.claude/`, `/.agents/`, and `.DS_Store`. Verify: `git status --short` no longer lists `.claude/` or `.agents/`.
- [x] 1.2 Stage only these paths: `.gitignore`, `STRUCTURE.md`, `ROADMAP.md`, `openspec/config.yaml`, `openspec/changes/archive/`. Show the staged list to the owner, then commit `docs: add project blueprint`. Verify: `git log --oneline` shows exactly one commit, and `git show --stat HEAD` lists only those paths.
- [x] 1.3 Explain what a push is. Run `git push -u origin main`. Verify: `git ls-remote origin main` returns the new commit hash, and the files are visible on github.com/hafid-firman-febrian/dayspoken.

## 2. GitHub repository check

- [x] 2.1 Install the GitHub CLI with `brew install gh`. Verify: `gh --version` prints a version. (Done before the owner chose the browser flow. `gh` is not logged in and not used in this change.)
- [x] 2.2 Verify the existing repository through the public GitHub API (design D11). Verify: `curl -s https://api.github.com/repos/hafid-firman-febrian/dayspoken` shows `"visibility": "public"` and `"default_branch": "main"`. Do not create or recreate the repository.

## 3. Branch and change artifacts

- [x] 3.1 Explain what a branch is and why each change gets its own. Run `git switch -c feat/setup-project-foundation`. Verify: `git branch --show-current` prints `feat/setup-project-foundation`.
- [x] 3.2 In `ROADMAP.md`, tick Proposed and Reviewed for entry 1. The owner's apply request is the review approval; if that is unclear, ask first. Verify: `git diff ROADMAP.md` shows only those two ticks.
- [x] 3.3 Explain Conventional Commits and the types used in this PR (`docs`, `chore`, `test`, `feat`, `ci`). Commit `openspec/changes/setup-project-foundation/` and `ROADMAP.md` as `docs(openspec): propose setup-project-foundation`. Verify: `git show --stat HEAD` lists only those paths.

## 4. Expo app with TypeScript and Expo Router

- [x] 4.1 Find the latest stable SDK with `npm view expo dist-tags --json` (58 today). Scaffold the `blank-typescript` template for that SDK in a temporary directory outside the repository (design D2), then move its files in.
  - Merge the template's `.gitignore` into the existing one. Keep the agent lines, and make sure `/android`, `/ios`, `.env`, `.env*.local`, and `coverage/` are listed.
  - Verify: `npm install` succeeds, and `package.json` pins the chosen `expo` version.
- [x] 4.2 Set the identity in `app.json` (design D3): name `Dayspoken`, slug and scheme `dayspoken`, `com.hafidfirmanfebrian.dayspoken` for both `ios.bundleIdentifier` and `android.package`, and portrait orientation. Verify: `npx expo config --type public` shows these values.
- [x] 4.3 Add Expo Router (design D2):
  - Run `npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar`.
  - Set `"main": "expo-router/entry"` and add the `expo-router` plugin.
  - Delete `App.tsx` and `index.ts`.
  - Create `app/_layout.tsx` (a root `Stack`) and `app/index.tsx` (a placeholder with the app name and one line of text, no colors).
  - Verify: `npx expo export --platform android --output-dir <tmp-dir>` finishes without errors. Delete the output afterwards.
- [x] 4.4 Configure TypeScript (design D6):
  - `tsconfig.json` extends `expo/tsconfig.base`, with `"strict": true` and `paths` `"@/*": ["src/*"]`.
  - Add the script `"typecheck": "tsc --noEmit"`, and add `.nvmrc` containing `22`.
  - Verify: `npm run typecheck` exits 0.
- [x] 4.5 Commit `chore: scaffold Expo app with TypeScript and Expo Router`. Verify: `git status --short` is clean, and no `node_modules/`, `.expo/`, `android/`, or `ios/` paths were committed.

## 5. Development build

- [x] 5.1 Run `npx expo install expo-dev-client`. Verify: `npx expo-doctor` reports no failed checks.
- [ ] 5.2 Build and run the development build on Android (design D4):
  - Export `ANDROID_HOME=$HOME/Library/Android/sdk` for the session. Edit `~/.zshrc` only if the owner agrees.
  - Start an emulator, or connect a USB device.
  - Run `npx expo run:android`.
  - Verify: the app opens through the dev client and shows the placeholder screen, and `git status --short` does not list `android/`.
  - Optional, not tracked: `npx expo run:ios`.
- [x] 5.3 Commit `chore: add expo-dev-client for development builds`. Verify: `git show --stat HEAD` lists only `package.json`, `package-lock.json`, `app.json` (if the plugin was added), and `tasks.md`.

## 6. ESLint and Prettier

- [x] 6.1 Set up ESLint and Prettier (design D7):
  - Run `npx expo lint` to create `eslint.config.js`.
  - Install `prettier`, `eslint-config-prettier`, and `eslint-plugin-prettier`, and add the plugin's recommended config.
  - Add `.prettierrc` (`singleQuote: true`, `printWidth: 100`) and `.prettierignore` (`openspec/`, `*.md`, `android/`, `ios/`, `.expo/`, `coverage/`, `package-lock.json`).
  - Add the scripts `"lint": "expo lint"` and `"format": "prettier --write ."`, then run `npm run format` once.
  - Verify: `npm run lint` exits 0, and `git diff --stat -- '*.md' openspec/` is empty.
- [x] 6.2 Make ESLint resolve the `@/` alias, and add the two structure rules (design D7):
  - `no-restricted-properties` on `process.env` for `app/**` and `src/**`, except `src/lib/env.ts`.
  - `no-restricted-imports` with the pattern `@/features/*/*`.
  - Verify with temporary probe files: a `process.env.FOO` read in `app/` and an import of `@/features/demo/components/X` each make `npm run lint` fail with the rule's message. A badly formatted line also makes it fail. Delete the probes, then `npm run lint` exits 0.
- [x] 6.3 Commit `chore: add ESLint and Prettier`. Verify: `git status --short` is clean.

## 7. Jest with React Native Testing Library

- [x] 7.1 Install the test tools (design D8):
  - `npx expo install jest-expo jest @types/jest -- --save-dev`.
  - `@testing-library/react-native` plus the peer its installed major version needs (`test-renderer` for v14).
  - Add `jest.config.js` with preset `jest-expo` and a `moduleNameMapper` for `@/`, and the script `"test": "jest"`.
  - Verify: `npx expo-doctor` and `npm ls @testing-library/react-native` report no peer dependency errors.
- [x] 7.2 Write `__tests__/app/index.test.tsx`. It renders the placeholder route and finds its text with RNTL. Verify: `npm test` passes. A deliberately wrong expected text makes it fail; undo that afterwards.
- [x] 7.3 Commit `test: set up Jest with React Native Testing Library`. Verify: `git status --short` is clean.

## 8. Public env config

- [x] 8.1 Install `zod` with `npm i zod`. Write `src/lib/env.test.ts` for the `app-env-config` scenarios:
  - `staging` throws an error that names `EXPO_PUBLIC_APP_ENV` and lists `development` and `production`
  - a missing value and an empty string both give `development`
  - `production` is returned as `production`
  - extra keys such as `SECRET_KEY` are not in the result

  Verify: the tests fail before the module exists.
- [x] 8.2 Implement `src/lib/env.ts` (design D9). `parseEnv(raw)` is pure and Zod-validated. `env` is built from an explicit object that reads `process.env.EXPO_PUBLIC_APP_ENV` by static member access. Verify: `npm test`, `npm run typecheck`, and `npm run lint` all pass, and the result is typed as `'development' | 'production'`.
- [ ] 8.3 Show the environment on the placeholder screen (for example "Environment: development"), and extend `__tests__/app/index.test.tsx` to assert it. Verify:
  - `npm test` passes.
  - With `EXPO_PUBLIC_APP_ENV=production` in `.env`, the development build shows "production" after Metro restarts.
  - Remove `.env` afterwards.
- [x] 8.4 Add `.env.example` with `EXPO_PUBLIC_APP_ENV=development`, a comment on the allowed values and the default, and a note that `EXPO_PUBLIC_*` values are public and never secrets. Verify: after `touch .env .env.local`, `git status --short` lists neither file. Delete both afterwards.
- [x] 8.5 Commit `feat: add typed public env config`. Verify: `git status --short` is clean.

## 9. CI workflow

- [x] 9.1 Check the latest major versions of `actions/checkout` and `actions/setup-node` on their release pages. Then write `.github/workflows/ci.yml` (design D10):
  - triggers: `pull_request` and `push` on `main`
  - `contents: read`
  - concurrency that cancels older PR runs
  - one job with the steps `npm ci`, `npm run typecheck`, `npm run lint`, and `npm test -- --ci`
  - lint and test steps guarded with `!cancelled() && steps.install.outcome == 'success'`
  - Node from `.nvmrc`, with the npm cache

  Verify: `npx --yes yaml-lint .github/workflows/ci.yml` passes. The real proof is the PR run in the workflow follow-up.
- [x] 9.2 Run the fresh-clone check:
  1. `git clone` the local repository into a temporary directory and check out the branch.
  2. Run `npm ci`, `npm run typecheck`, `npm run lint`, and `npm test` there, with no `.env` and no dev server.

  Verify: all four exit 0. If typecheck fails because generated Expo types are missing, apply the mitigation in design (Risks), then repeat. Delete the temporary clone afterwards.
- [ ] 9.3 Commit `ci: add typecheck, lint, and test workflow`. Verify: `git status --short` is clean.

## 10. Documentation

- [ ] 10.1 Update `STRUCTURE.md` (design D14):
  - the `@/` import alias
  - the check scripts and `.nvmrc`
  - route tests in `__tests__/app/`
  - the two lint-enforced rules
  - change artifacts committed on the change's branch
  - merge with a merge commit, and delete the branch
  - the Git workflow split: the agent runs local `git`, and the owner opens the PR, watches CI, and merges in the browser. This replaces the lines about `gh` and `gh auth login`.

  Verify: `git diff STRUCTURE.md` shows these points and changes no other section.
- [ ] 10.2 Update the two `operations.apply.guidance` entries in `openspec/config.yaml` that mention `gh` (design D14). Verify:
  - `grep -n -w gh openspec/config.yaml` finds nothing.
  - `openspec instructions apply --change setup-project-foundation --json` shows the new guidance.
  - `git diff openspec/config.yaml` touches only those two entries.
- [ ] 10.3 Commit `docs: update conventions and Git workflow`. Verify: `git status --short` is clean.

## 11. Final checks and Applied

- [ ] 11.1 Run `npm run typecheck`, `npm run lint`, `npm test`, and `npx expo-doctor` on the final tree. Verify: all exit 0, and every earlier task in this file is checked.
- [ ] 11.2 Tick Applied for entry 1 in `ROADMAP.md`, then commit it with the final `tasks.md` as `docs: tick Applied for setup-project-foundation`. Verify: `git status --short` is clean, and `git log --oneline main..HEAD` shows the nine branch commits listed in design D12.

## Workflow follow-up

These steps come after Applied, as the apply guidance says. The agent runs `git`, and the owner does the GitHub steps in the browser (design D11, D12). Explain each step in plain Indonesian before it happens.

- **Push the branch (agent):** `git push -u origin feat/setup-project-foundation`. Show the owner where the branch appears on GitHub.
- **Open the pull request (owner, browser):**
  1. Check that the avatar in the top-right corner is `hafid-firman-febrian`.
  2. Click the "Compare & pull request" banner. Base is `main`, compare is `feat/setup-project-foundation`.
  3. Paste the title `feat: set up project foundation` and the body the agent prepares (a summary, a link to `openspec/changes/setup-project-foundation/`, and how it was verified).
  4. Click "Create pull request".
  5. The owner shares the PR URL, and the agent confirms the PR exists through the public API.
- **Wait for CI (owner watches, agent confirms):**
  - The owner watches the Checks tab and its three steps.
  - The agent confirms the result through the public check-runs API.
  - If CI is red, the owner copies the failing lines of the failed step. The agent fixes with a new Conventional Commit and pushes, and CI runs again on the same PR.
- **Review (owner, browser):** look through the "Files changed" tab.
- **Merge (owner, browser):** after green CI, check that the dropdown says "Create a merge commit", then click "Merge pull request" → "Confirm merge" → "Delete branch".
- **Update the local `main` (agent):** `git switch main && git pull`, then `git branch -d feat/setup-project-foundation` and `git fetch --prune`. Confirm that `git log --oneline` shows the merge commit and that the CI run on `main` passes.
- **Archive:** in a separate request, after the merge, use `openspec-archive-change`: switch to `main` and pull, tick Archived, commit `chore(openspec): archive setup-project-foundation`, and push.
