# continuous-integration Specification

## Purpose

Defines the automated quality gate for Dayspoken: the same typecheck, lint, and test checks run on a developer's machine and on GitHub for every pull request and every push to `main`, and a pull request is merged only when they pass.

## Requirements

### Requirement: Local check commands

The repository SHALL provide npm scripts that run each check from a fresh clone after `npm ci`, with no running dev server and no `.env` file:
- `npm run typecheck` checks TypeScript in strict mode.
- `npm run lint` runs ESLint, including Prettier formatting.
- `npm test` runs the Jest test suite.

Each script SHALL exit with a non-zero code when its check fails.

#### Scenario: All checks pass on a fresh clone

- **WHEN** a developer clones the repository, runs `npm ci`, and then runs `npm run typecheck`, `npm run lint`, and `npm test`
- **THEN** each command exits with code 0

#### Scenario: A type error fails typecheck

- **WHEN** a file in `app/` or `src/` contains a TypeScript type error
- **THEN** `npm run typecheck` exits with a non-zero code and names the file

#### Scenario: A formatting error fails lint

- **WHEN** a source file is not formatted according to the Prettier config
- **THEN** `npm run lint` exits with a non-zero code and names the file

#### Scenario: A failing test fails the test command

- **WHEN** any Jest test fails
- **THEN** `npm test` exits with a non-zero code

### Requirement: Checks run on GitHub

GitHub Actions SHALL run typecheck, lint, and tests:
- on every pull request that targets `main`
- on every push to `main`

The run SHALL fail when any of the three checks fails. Each check's result SHALL be visible as a separate step.

#### Scenario: Pull request with passing checks

- **WHEN** a pull request targeting `main` is opened or updated and all three checks pass
- **THEN** the pull request shows a successful CI check

#### Scenario: Pull request with a failing check

- **WHEN** a pull request targeting `main` is opened or updated and lint fails
- **THEN** the pull request shows a failed CI check, and the run log shows the lint step as the failed step

#### Scenario: Push to main

- **WHEN** a commit is pushed to `main`
- **THEN** a CI run starts for that commit

#### Scenario: Newer push supersedes an older run

- **WHEN** a new commit is pushed to a pull request while an earlier CI run for the same pull request is still running
- **THEN** the earlier run is cancelled and only the newest commit's run reports a result

### Requirement: CI uses the locked dependencies and the project Node version

CI SHALL install dependencies only from the committed `package-lock.json`. It SHALL use the Node.js version recorded in the repository, the same version used for local development.

#### Scenario: Lockfile out of sync

- **WHEN** `package.json` changes without a matching `package-lock.json` update
- **THEN** the CI install step fails

#### Scenario: Node version comes from the repository

- **WHEN** the recorded Node.js version is changed in the repository
- **THEN** the next CI run uses the new version without editing the workflow file

### Requirement: Green CI before merging

A pull request into `main` SHALL be merged only after its latest CI run has passed. The person merging SHALL confirm the CI result first.

#### Scenario: Merge after green CI

- **WHEN** the latest CI run on a pull request has passed and the owner confirms the merge
- **THEN** the pull request is merged into `main` and its branch is deleted

#### Scenario: Merge is held while CI is red or running

- **WHEN** the latest CI run on a pull request has failed or is still running
- **THEN** the pull request is not merged until a later run passes

### Requirement: Database checks run on GitHub

A separate GitHub Actions workflow SHALL run the database checks when a pull request to `main`, or a push to `main`, changes a file under `supabase/`, the database workflow file, or `package-lock.json`. The checks SHALL start the local backend, replay every migration from an empty database, run the database tests and the API checks, and fail when the generated types file is out of date.

#### Scenario: Migration change

- **WHEN** a pull request changes a file under `supabase/migrations/`
- **THEN** the database workflow runs the checks and reports its result on the pull request

#### Scenario: Unrelated change

- **WHEN** a pull request changes only files outside `supabase/`
- **THEN** the database workflow does not run, and the existing typecheck, lint, and test job still does

#### Scenario: Stale types

- **WHEN** a pull request adds a migration and does not update the generated types file
- **THEN** the database workflow fails

### Requirement: The database workflow needs no secrets

The database workflow SHALL use only the local backend and the locked CLI version from `package-lock.json`. It SHALL NOT use any secret, access token, or cloud project.

#### Scenario: Fork pull request

- **WHEN** a pull request comes from a fork with no repository secrets
- **THEN** the database workflow runs the same checks and can pass
