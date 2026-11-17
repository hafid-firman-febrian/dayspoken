# Design

## Context

See `proposal.md` for the motivation. Requirements are in `specs/app-env-config/spec.md` and `specs/continuous-integration/spec.md`.

**Repository (observed 2026-11-16):**
- Git is initialized on `main` with no commits.
- Untracked: `STRUCTURE.md`, `ROADMAP.md`, `openspec/`, `.claude/`, `.agents/`.
- `origin` is `git@hafid.github.com:hafid-firman-febrian/dayspoken.git`. `hafid.github.com` is an SSH host alias for `github.com` that uses the key `~/.ssh/hafid`.
- The GitHub repository already exists: public, empty, default branch `main`, with a description already set.

**Machine:**
- Node 22.22.1 and npm 10.9.4.
- Homebrew is installed.
- The GitHub CLI (`gh`) was not installed. Task 2.1 installed it before the owner chose the browser flow; it is not logged in and not used.
- Android SDK at `~/Library/Android/sdk` (`adb` works), but `ANDROID_HOME` is not set.
- OpenJDK 17 and Xcode 26.2. No Watchman (optional for Metro).

**Expo (npm registry, 2026-11-16):**
- `expo@latest` is 58.0.25 (SDK 58).
- The `blank-typescript` template for SDK 58 pins React Native 0.88.1, React 19.3.0, and TypeScript ~6.0.3.
- Expo 58 requires Node `^22.13.0 || ^24.3.0 || …`.
- `@testing-library/react-native` latest is 14.1.0. Its peers are `jest >=29`, `react >=19`, and `test-renderer ^1`.

**Owner decisions:**
- The repository stays public.
- App id `com.hafidfirmanfebrian.dayspoken`.
- `.claude/` and `.agents/` go into `.gitignore`.
- **2026-11-17:** no GitHub CLI login.
  - The agent runs local `git` commands.
  - The owner does the GitHub steps in the browser, and the agent explains each one.
  - This is the standing workflow for every later change.

## Goals / Non-Goals

**Goals:**
- The repository passes every check from a fresh clone (`npm ci`, then typecheck, lint, test) with no dev server and no `.env`.
- The development build opens on Android and shows the placeholder route.
- Two `STRUCTURE.md` rules are enforced by lint instead of by memory: environment access and feature imports.
- The owner finishes with a merged first PR and understands each step.

**Non-Goals:**
- No providers in the root layout (TanStack Query, theme, fonts). They arrive with the changes that need them.
- No web target. `react-native-web` is not installed.
  - `react-dom` is installed anyway, because Expo Router's dependencies (Radix tabs, `@expo/metro-runtime`) require it as a peer.
  - It is pinned with `npx expo install react-dom` to the same version as `react` (19.3.0), as Expo's default template does.
  - Without the pin, npm picks the newest `react-dom`, which needs a newer `react`, and later installs fail with ERESOLVE.
- No `eas.json`, no Expo account, and no APK.
- No branch protection on `main`.

## Decisions

### D1. Git order: blueprint on `main` first, then everything else on the branch

1. **Initial commit on `main`.** Message: `docs: add project blueprint`. Contents:
   - `.gitignore` with only `/.claude/`, `/.agents/`, and `.DS_Store`
   - `STRUCTURE.md` and `ROADMAP.md`
   - `openspec/config.yaml` and `openspec/changes/archive/`

   Files are staged by explicit path, so nothing else slips in.
2. **Push `main`.** `git push -u origin main`, so the pull request has a base.
3. **Create the branch.** `git switch -c feat/setup-project-foundation`.
4. **First branch commit.** Message: `docs(openspec): propose setup-project-foundation`. It holds this change's folder (`openspec/changes/setup-project-foundation/`) and the `ROADMAP.md` ticks for Proposed and Reviewed.

- **Why:** the pull request shows the plan next to the code it produced. Every later change can follow the same pattern: proposal artifacts are committed on the change's branch.
- **Alternative rejected:** putting this change's artifacts in the initial commit. The plan would then skip the PR, and later changes would have no consistent home for their artifacts.

### D2. Scaffold from the `blank-typescript` template, then add Expo Router by hand

- **How:**
  1. Run `npx create-expo-app@latest <tmp-dir> --template blank-typescript@sdk-<N>` in a temporary directory outside the repository, then move its files in. `N` is the SDK of `npm view expo dist-tags latest` at apply time; 58 today.
  2. Merge the template's `.gitignore` into the existing one.
  3. Delete `App.tsx` and `index.ts`.
  4. Set `"main": "expo-router/entry"` in `package.json`.
  5. Install with `npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar`.
  6. Install every Expo-related package with `npx expo install`, so its version matches the SDK.
- **Why:**
  - The repository folder is not empty, and `create-expo-app` expects an empty target.
  - The default template brings example tabs, web support, Reanimated, Gesture Handler, `@expo/ui`, glass effect, symbols, and `expo-image`. Later changes add those on purpose, or never need them.
- **Alternative rejected:** the default template plus deleting its examples. That is more to remove, and it leaves dependencies nobody asked for.

### D3. Static `app.json` identity

| Field | Value |
|---|---|
| `name` | `Dayspoken` |
| `slug` | `dayspoken` |
| `scheme` | `dayspoken` |
| `ios.bundleIdentifier`, `android.package` | `com.hafidfirmanfebrian.dayspoken` |
| `orientation` | `portrait` |
| `plugins` | `expo-router` (plus whatever `npx expo install` adds) |

- `userInterfaceStyle` keeps the template value. Light/dark belongs to `setup-design-system`.
- **Why `app.json` instead of `app.config.ts`:** nothing is dynamic yet. A static file also cannot pass `process.env` values into the bundle through `extra`, which protects the public-only rule (`app-env-config`).

### D4. Development build, built locally

- **Install:** `npx expo install expo-dev-client`.
- **Android (required):** build and run with `npx expo run:android` on an emulator or a USB device.
  - It needs `ANDROID_HOME=$HOME/Library/Android/sdk`, set for the session.
  - Adding that line to the owner's `~/.zshrc` happens only if the owner agrees.
- **iOS (optional):** `npx expo run:ios`. iOS appears only in the demo video.
- **Native folders:** `android/` and `ios/` are generated and git-ignored (Continuous Native Generation). Native config lives in `app.json` and config plugins.
- **Why local instead of EAS:** it costs Rp 0 and needs no Expo account. EAS free-tier limits are checked in `prepare-portfolio-release`.
- **Alternative rejected:** committing `android/` and `ios/`. The native code drifts from `app.json`, and every upgrade gets harder.

### D5. Only folders that hold files

| Path | Contents |
|---|---|
| `app/_layout.tsx` | Root `Stack`. No providers yet |
| `app/index.tsx` | Placeholder screen: the app name and one line of text. Layout styles only, no colors |
| `src/lib/env.ts`, `src/lib/env.test.ts` | Env module and its tests (D9) |
| `__tests__/app/index.test.tsx` | Placeholder route test (D8) |
| `.github/workflows/ci.yml` | CI (D10) |

- **Not created:** `src/features/`, `src/ui/`, `src/theme/`, `src/utils/`, `supabase/`, `e2e/`, `docs/`. Git does not track empty folders, `.gitkeep` files are noise, and `STRUCTURE.md` already documents the tree.
- **Deviation from `STRUCTURE.md`:** `app/index.tsx` holds its own tiny UI instead of composing a feature screen. This is temporary; `add-email-otp-auth` and `add-app-shell-navigation` replace it. A feature folder for a placeholder would be worse.

### D6. TypeScript and the `@/` import alias

- **TypeScript:** `tsconfig.json` extends `expo/tsconfig.base` with `"strict": true`. `npm run typecheck` runs `tsc --noEmit`.
- **Import alias:** `paths: { "@/*": ["src/*"] }`.
  - Metro resolves tsconfig paths natively.
  - Jest maps the alias with `moduleNameMapper`.
  - ESLint's import resolver must also resolve it. If `eslint-config-expo` does not, add `eslint-import-resolver-typescript`.
- **Why the alias:** no `../../../` chains, and the feature-import lint rule (D7) gets a stable pattern to match.
- **Alternative rejected:** relative imports only.

### D7. ESLint with Prettier, plus two structure rules

- **Setup:**
  - `npx expo lint` creates the flat `eslint.config.js` with `eslint-config-expo`.
  - Prettier is added the way the Expo docs describe: `prettier`, `eslint-config-prettier`, and `eslint-plugin-prettier` (recommended config).
  - Formatting problems therefore fail `npm run lint`, and CI stays at three checks.
- **Prettier config:** `singleQuote: true`, `printWidth: 100`, defaults otherwise.
- **`.prettierignore`:** `openspec/`, `*.md`, `android/`, `ios/`, `.expo/`, `coverage/`, `package-lock.json`. The Markdown docs are hand-written with wide tables, and Prettier would rewrap them.
- **Scripts:**
  - `lint`: `expo lint`
  - `format`: `prettier --write .`
- **Structure rules:**
  - **Environment access** (`app-env-config`): `no-restricted-properties` on `process.env` for `app/**` and `src/**`, except `src/lib/env.ts`.
  - **Feature imports** (`STRUCTURE.md`, features stay isolated): `no-restricted-imports` with the pattern `@/features/*/*` and the message "Import a feature only through its index.ts". Imports inside a feature are relative, so this pattern does not match them.
- **Alternative rejected:** `eslint-plugin-boundaries`. It is heavier than two built-in rules.

### D8. Jest with React Native Testing Library

- **Install:**
  - `npx expo install jest-expo jest @types/jest -- --save-dev`.
  - `npm i -D @testing-library/react-native` and the peer its installed major version needs (`test-renderer` for v14). Follow the RNTL install page for matcher setup.
- **Config:** `jest.config.js` with preset `jest-expo` and `moduleNameMapper` for `@/`. `npm test` runs `jest`.
- **Test location:**
  - Tests sit next to the file they test.
  - **Exception:** Expo Router treats every file in `app/` as a route, so route tests live in `__tests__/app/` and mirror the route path. `STRUCTURE.md` records this.
- **First tests:**
  - `src/lib/env.test.ts` covers the `app-env-config` scenarios.
  - `__tests__/app/index.test.tsx` renders the placeholder route and finds its text, which proves the Jest, RNTL, and Expo setup works.

### D9. The env module

- **Shape:** `src/lib/env.ts` exports two things:
  - `parseEnv(raw)`: pure, validates with Zod, unit-tested directly.
  - `env`: the result of `parseEnv({ EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV })`.
- **Why the explicit object:**
  - Expo inlines `process.env.EXPO_PUBLIC_*` at bundle time, and only for static member access. Destructuring and dynamic keys do not work.
  - The explicit object is also an allow-list, so nothing else from the environment reaches the module.
- **First variable:** `EXPO_PUBLIC_APP_ENV`.
  - Values: `development | production`. Default: `development`. An empty string counts as missing.
  - Later changes use it to tell builds apart, for example the Sentry environment.
- **Error message:** `Invalid EXPO_PUBLIC_APP_ENV: expected one of development, production (received "staging")`.
- **Files:**
  - `.env.example` lists each variable with a comment and an example value.
  - `.gitignore` covers `.env` and `.env*.local`.
- **Reminder in `.env.example`:** `EXPO_PUBLIC_*` values ship inside the app and anyone can read them, so they are never secrets.
- **New dependency `zod`:** the agreed validation library (forms, AI output). MIT-licensed and free. It is plain JavaScript, so it is installed with `npm i zod`.

### D10. CI workflow

`.github/workflows/ci.yml`:
- **Triggers:** `pull_request` to `main`, and `push` to `main`.
- **Permissions:** `contents: read`.
- **Concurrency:** group `ci-${{ github.ref }}`, with `cancel-in-progress` only for pull requests. Runs on `main` always finish.
- **Job:** one job `checks` named "Typecheck, lint, test", on `ubuntu-latest`, with a 15-minute timeout.
- **Steps:**
  1. Check out the code.
  2. Set up Node with `node-version-file: .nvmrc` and the npm cache.
  3. `npm ci`
  4. `npm run typecheck`
  5. `npm run lint`
  6. `npm test -- --ci`
- **Every check reports:** lint and test use `if: ${{ !cancelled() && steps.install.outcome == 'success' }}`, so all three run and report even when an earlier one fails. A beginner then sees every problem in one run.
- **Action versions:** the latest major of `actions/checkout` and `actions/setup-node` at apply time, checked on their release pages.
- **`.nvmrc`:** `22`. It matches local Node 22.22.1 and the SDK 58 engine range.
- **Alternative rejected:** three parallel jobs. They triple the install time for a small suite.

### D11. GitHub steps happen in the browser

**Who does what:**

| Step | Who | Where |
|---|---|---|
| Branch, commit, push | Agent | Terminal, over the existing SSH remote (`origin` with the alias `hafid.github.com` and the key `~/.ssh/hafid`) |
| Open the PR, watch CI, review, merge, delete the branch | Owner | github.com, guided by the agent |
| Update the local `main` after the merge | Agent | Terminal |

**Repository:**
- **Verify, do not create.** Run `curl -s https://api.github.com/repos/hafid-firman-febrian/dayspoken` and check for `"visibility": "public"` and `"default_branch": "main"`.
- Visibility stays public.

**Reading GitHub without a token:**
- The repository is public, so the agent reads PR and CI status through the unauthenticated GitHub REST API. For example: `GET /repos/{owner}/{repo}/commits/{sha}/check-runs`.
- Detailed job logs need a token. When a step fails, the owner copies the failing lines from the Checks tab.

**Why:**
- The owner wants to do the GitHub steps themselves, to learn them.
- No token is stored on the machine.

**Alternative rejected:** logging in with the GitHub CLI so the agent can open, watch, and merge the PR. The owner declined. `gh` stays installed but unused, and can be removed with `brew uninstall gh`.

### D12. Commits, pull request, CI, merge

- **Commits on the branch** (Conventional Commits, one per task group):
  1. `docs(openspec): propose setup-project-foundation`
  2. `chore: scaffold Expo app with TypeScript and Expo Router`
  3. `chore: add expo-dev-client for development builds`
  4. `chore: add ESLint and Prettier`
  5. `test: set up Jest with React Native Testing Library`
  6. `feat: add typed public env config`
  7. `ci: add typecheck, lint, and test workflow`
  8. `docs: update conventions and Git workflow`
  9. `docs: tick Applied for setup-project-foundation`
- **Before the first push:** check the staged file list. The repository is public, so whatever is pushed stays public.
- **Push (agent):** `git push -u origin feat/setup-project-foundation`.
- **Pull request (owner, in the browser):**
  1. On the repository page, click the **"Compare & pull request"** banner. Without it, go to **Pull requests → New pull request**.
  2. Set base `main` ← compare `feat/setup-project-foundation`.
  3. Paste the title `feat: set up project foundation` and the body prepared by the agent (a summary, a link to the change folder, and how it was verified).
  4. Click **Create pull request**.
- **CI (owner watches, agent confirms):**
  - The owner watches the PR's **Checks** tab, or the status box at the bottom of the Conversation tab.
  - The agent confirms each result through the public check-runs API.
  - If CI is red, the owner opens the failed step and copies its error lines. The agent fixes the problem with a new commit and pushes. The PR picks up the new commit by itself, and CI runs again.
- **Merge (owner, in the browser):**
  1. The owner reviews the **Files changed** tab.
  2. When CI is green, the owner checks that the merge button's dropdown says **"Create a merge commit"**, then clicks **Merge pull request** and **Confirm merge**.
  3. The owner clicks **Delete branch**.
- **After the merge (agent):** `git switch main`, `git pull`, `git branch -d feat/setup-project-foundation`, and `git fetch --prune`.
- **Why a merge commit:** it keeps every Conventional Commit on `main`, so the history shows the steps the owner just learned, and it is GitHub's default button.
- **Alternatives rejected:**
  - Squash: one commit per change, which hides those steps.
  - Rebase: it rewrites commit ids, which is confusing on a first PR.

### D13. Teaching in Indonesian

- **Before each `git` command:** the agent says in one to three plain Indonesian sentences what the command does and why.
- **After it:** the agent says what changed and where to see it, either in the terminal or on GitHub.
- **For each browser step:** the agent names the page, the button to click, what to fill in, and what the owner should see afterwards. The owner reports back, and the agent confirms the result through the public API where it can.
- **Order of concepts:** repository and commit → `main` → branch → Conventional Commit types → push → pull request → CI → review → merge → pull.
- **Glossary:** the first walkthrough includes a short glossary.
- **Where it lives:** the walkthrough is conversation, not a file. `docs/` is reserved for the privacy policy and screenshots.

### D14. Updates to `STRUCTURE.md` and `openspec/config.yaml`

**`STRUCTURE.md`:**
- **Conventions:** the `@/` alias; the check scripts (`typecheck`, `lint`, `format`, `test`) and `.nvmrc`; route tests in `__tests__/app/`.
- **Git workflow:**
  - Change artifacts are committed on the change's branch.
  - Pull requests are merged with a merge commit, and the branch is deleted.
  - The agent runs local `git` commands. The owner opens the PR, watches CI, and merges in the browser, with the agent explaining each step.
  - This replaces the old lines saying that the agent runs `gh` and the owner runs `gh auth login` once.
- **Lint enforcement:** the environment-access and feature-import rules are now lint errors.

**`openspec/config.yaml`, `operations.apply.guidance`:**
- **The entry "Run the git and gh commands yourself…"** becomes: the agent runs the local `git` commands, and the owner does the GitHub steps (PR, CI, merge) in the browser. The agent explains every step in plain Indonesian.
- **The entry "…open the PR with gh…"** becomes: push the branch, then guide the owner through opening the PR in the browser, green CI, and merging.
- No other entry changes, and `context` and `rules` stay as they are.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| SDK 58 package versions do not fit together (`jest-expo`, RNTL, `eslint-config-expo`, ESLint 10) | Install Expo packages with `npx expo install` and run `npx expo-doctor`. If the latest RNTL does not work with `jest-expo`, use the version the Expo testing docs name |
| Typecheck needs files that only exist after `expo start` (`expo-env.d.ts`, `.expo/types`), so CI fails | Before pushing, clone the branch into a temporary folder and run `npm ci` and all checks there. If it fails, commit a small declaration file that references `expo/types`, or turn off typed routes until a change needs them |
| Without a token, the agent cannot read detailed CI logs | The agent reads pass or fail per step through the public check-runs API. The owner copies the failing lines from the Checks tab |
| The unauthenticated GitHub API allows only 60 requests per hour | The agent checks status only when the owner reports a change, or at most once a minute while waiting |
| The browser is logged in to a different GitHub account, so the PR is opened by the wrong user | Before opening the PR, the owner checks that the avatar in the top-right corner is `hafid-firman-febrian` |
| The owner picks squash or rebase in the merge dropdown | The agent names the exact option ("Create a merge commit") right before the merge. GitHub remembers the last choice |
| `ANDROID_HOME` is not set, or there is no emulator | Export `ANDROID_HOME` for the session. The owner creates an emulator in Android Studio or plugs in a phone. The first build is slow (10 minutes or more) |
| Prettier reformats template files the first time | Run `npm run format` once inside the lint commit |
| "Green CI before merge" is a rule followed by people, not enforced by GitHub, because the archive guidance pushes to `main` directly | The owner checks the Checks tab, and the agent confirms green CI through the API, before the owner merges. A ruleset with admin bypass can be proposed later as its own `ROADMAP.md` entry |
| A public repository exposes anything committed | `.env`, `.claude/`, and `.agents/` are ignored. Check the staged files before every push |

**Rollback:**
- Before the merge, close the PR and delete the branch. `main` then holds only the blueprint commit.
- After the merge, `git revert -m 1 <merge-commit>`.

## Free-tier facts to verify

- **GitHub Actions:** standard GitHub-hosted runners are free, with no minute limit, for public repositories. Check the GitHub Actions billing page before relying on it.
- **EAS:** not used by this change.
