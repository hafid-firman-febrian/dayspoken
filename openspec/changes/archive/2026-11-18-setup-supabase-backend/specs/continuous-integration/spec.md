# Spec Delta

## ADDED Requirements

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
