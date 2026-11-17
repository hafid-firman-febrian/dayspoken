# Proposal

## Why

Dayspoken has a blueprint (`STRUCTURE.md`, `ROADMAP.md`, `openspec/config.yaml`) but no app, no version history, and no checks. Every later change needs a runnable Expo app, the agreed folder layout, and a CI gate. This change implements **ROADMAP.md entry 1, `setup-project-foundation`**, and is also the owner's first guided pull request, so it sets the Git routine that every later change repeats.

## What Changes

- **Initial commit on `main`:** the blueprint files (`STRUCTURE.md`, `ROADMAP.md`, `openspec/config.yaml`, the archived `project-blueprint` change) plus a `.gitignore` that keeps the local agent folders `.claude/` and `.agents/` out of the repository (owner's decision). Pushed to the existing GitHub repository.
- **Expo app scaffold:** the latest stable Expo SDK (SDK 58 at the time of writing; re-checked at apply), TypeScript `strict`, Expo Router with one placeholder route, and `expo-dev-client` for a development build. npm is the package manager. App id `com.hafidfirmanfebrian.dayspoken` for Android and iOS (owner's decision).
- **Folders:** only the folders this change fills: `app/`, `src/lib/`, and `.github/workflows/`. The other folders in `STRUCTURE.md` are created by the changes that first put files in them.
- **Code quality:** ESLint (Expo config) with Prettier, including two lint rules that make `STRUCTURE.md` rules mechanical: environment access only through the env module, and no deep imports into a feature.
- **Tests:** Jest (`jest-expo`) with React Native Testing Library, plus first tests for the env module and the placeholder route.
- **Env config:** one typed, validated module for public `EXPO_PUBLIC_*` values, a committed `.env.example`, and git-ignored `.env` files.
- **CI:** a GitHub Actions workflow that runs typecheck, lint, and tests on every pull request and on every push to `main`.
- **GitHub repository:** `hafid-firman-febrian/dayspoken` already exists (public, empty). The owner keeps it **public**. This change verifies it through the public GitHub API instead of creating a new one.
- **First pull request:** all work lands on `feat/setup-project-foundation` in Conventional Commits.
  - The agent runs the local `git` steps (branch, commit, push).
  - The owner does the GitHub steps in the browser (open the PR, watch CI, merge).
  - Every step is explained in plain Indonesian.
  - There is no GitHub CLI login (owner's decision, 2026-11-17). This becomes the standing workflow for every later change.
- **Docs:**
  - `STRUCTURE.md` gains the new conventions (import alias, check scripts, route-test location, merge method) and the new Git workflow split.
  - `openspec/config.yaml` apply guidance no longer mentions `gh`.
  - `ROADMAP.md` gets its checkboxes ticked.

## Capabilities

### New Capabilities

- `app-env-config`: how the app receives configuration: public `EXPO_PUBLIC_*` values only, read through one typed module, validated with clear errors, and documented in `.env.example`.
- `continuous-integration`: the automated checks (typecheck, lint, tests) that run locally through npm scripts and on GitHub for every pull request and push to `main`, and that must pass before merging.

### Modified Capabilities

_None. There are no existing specs._

## Out of scope

- NativeWind, theme, tokens, fonts, light/dark mode, and every UI component (`setup-design-system`). The placeholder route uses no colors.
- Supabase: client, environment variables, CLI, migrations (`setup-supabase-backend`).
- Any feature screen, navigation shell, or tab bar (`add-email-otp-auth`, `add-app-shell-navigation`, and later).
- Folders without files yet: `src/features/`, `src/ui/`, `src/theme/`, `src/utils/`, `supabase/`, `e2e/`, `docs/`.
- EAS Build configuration (`eas.json`) and any APK release (`prepare-portfolio-release`).
- Maestro E2E and Sentry (`add-monitoring-e2e`).
- A README (`prepare-portfolio-release`).
- Branch protection rules on `main`. The archive guidance commits directly to `main`, so protecting it would change the agreed archive flow.

## Cost impact

Rp 0. Every new dependency is open source (Expo, Expo Router, `expo-dev-client`, ESLint, Prettier, Jest, React Native Testing Library, Zod). GitHub Actions is free with no minute limit for public repositories. The development build is built locally with the installed Android SDK, so no EAS account is needed.

## Changes to agreed decisions

**One agreed decision changes: who does the GitHub steps.**
- **Before:** the agent ran the `git` and `gh` commands, and the owner ran `gh auth login` once.
- **Now:** the owner chose not to log in to the GitHub CLI.
  - The agent runs local `git` only.
  - The owner opens the PR, watches CI, and merges in the browser, with the agent explaining each step.
- **This change updates:**
  - `STRUCTURE.md` (Git workflow)
  - `openspec/config.yaml` (the two apply guidance entries that mention `gh`)
- `ROADMAP.md` entry 1 keeps its propose prompt as the original request.

**Details filled in or adjusted:**
- **GitHub repository:** the roadmap says to create it. It already exists, so this change verifies and uses it.
- **`STRUCTURE.md`** gains conventions that this change introduces:
  - the `@/` import alias for `src/`
  - the npm check scripts
  - route tests in `__tests__/` (Expo Router treats every file in `app/` as a route)
  - the merge method for pull requests
  - change artifacts committed on the change's branch

Apart from that, `ROADMAP.md` is updated only by ticking boxes.

## Impact

- **New files:**
  - `package.json`, `package-lock.json`, `app.json`, `tsconfig.json`
  - `eslint.config.js`, `.prettierrc`, `.prettierignore`, `jest.config.js`
  - `.nvmrc`, `.env.example`, `.gitignore`, `assets/`
  - `app/_layout.tsx`, `app/index.tsx`
  - `src/lib/env.ts`, `src/lib/env.test.ts`, `__tests__/app/index.test.tsx`
  - `.github/workflows/ci.yml`
- **Edited files:** `STRUCTURE.md`, `ROADMAP.md`, `openspec/config.yaml`.
- **Git and GitHub:**
  - the first commits on `main`, and the branch `feat/setup-project-foundation`
  - the first pull request (opened by the owner in the browser) and the first CI runs on `hafid-firman-febrian/dayspoken`
- **Owner's machine:** the development build is built locally with the Android SDK.
