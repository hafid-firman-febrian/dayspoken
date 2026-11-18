# database-workflow Specification

## Purpose

Defines how a developer runs, tests, and deploys the Dayspoken backend: a local database for development, one command per task, generated types that stay current, and the same migrations applied to the cloud project, with no secret kept in the repository.

## Requirements

### Requirement: Local backend with one command

A developer SHALL be able to start and stop a local copy of the backend (database, auth, storage, and API) with one npm script each, using the Supabase CLI that the repository pins. When the container runtime is not running, the start script SHALL fail with a message that says so.

#### Scenario: Start

- **WHEN** Docker is running and the developer runs the start script
- **THEN** the local backend starts and prints its URL and its publishable key

#### Scenario: Docker is off

- **WHEN** Docker is not running and the developer runs the start script
- **THEN** the script fails and the message says that the container runtime is not running

### Requirement: Reset replays every migration

A developer SHALL be able to reset the local database with one npm script. The reset SHALL drop the local data and replay every migration from empty. It SHALL leave the complete schema and the `plan_limits` rows, and no demo data.

#### Scenario: Reset

- **WHEN** the developer runs the reset script on a database with test data
- **THEN** the test data is gone, the full schema exists, and `plan_limits` has its three rows

### Requirement: Database tests

The repository SHALL have database tests that check the schema, the access rules, and the storage rules, and one npm script that runs them against the local database. The script SHALL exit with a non-zero code when any test fails. Rules that only the running API enforces (bucket size and type limits, signed link expiry, anonymous access over HTTP, and `ping`) SHALL be checked by a second script that calls the local API, and it SHALL also exit with a non-zero code on failure.

#### Scenario: All pass

- **WHEN** the developer runs the database test script on a freshly reset database
- **THEN** every test passes and the script exits with code 0

#### Scenario: API-level rules

- **WHEN** the developer runs the API check script against the running local backend
- **THEN** it confirms that an oversized or wrongly typed upload is refused, that a signed link stops working after it expires, and that an anonymous visitor reads no table but can call `ping`

#### Scenario: A broken rule

- **WHEN** a policy is removed from a migration and the database is reset and tested
- **THEN** the test for that rule fails and the script exits with a non-zero code

### Requirement: Generated types are the single source of data types

TypeScript types SHALL be generated from the local database with one npm script into `supabase/functions/_shared/database.types.ts`, and the generated file SHALL be committed. The app and the server code SHALL take their data types from it. Formatting and lint tools SHALL leave the file alone.

#### Scenario: Regenerate

- **WHEN** a migration adds a column and the developer runs the generate script
- **THEN** the types file contains the new column

#### Scenario: Enum values

- **WHEN** the types are generated
- **THEN** the entry status appears as a union of its five values

### Requirement: Out-of-date types are detected

A script SHALL compare the committed types file with a freshly generated one, and SHALL fail when they differ.

#### Scenario: Stale types

- **WHEN** a migration is added and the types file is not regenerated
- **THEN** the check fails

### Requirement: The cloud project gets the same migrations

The cloud project SHALL receive the schema only by applying the repository's migration files with the Supabase CLI. The schema SHALL NOT be edited by hand in the Supabase dashboard.

#### Scenario: Push

- **WHEN** the owner links the repository to the cloud project and pushes the migrations
- **THEN** the cloud database lists exactly the migrations that are in the repository

#### Scenario: Cloud matches local

- **WHEN** the cloud database is queried as an anonymous visitor
- **THEN** it behaves like the local database: no table is readable, and `ping` returns a success value

### Requirement: No secret is committed

The repository SHALL NOT contain the database password, a secret key, an access token, or a signing secret. Local environment files SHALL stay out of Git. The app and the continuous integration SHALL need only public values and the local stack.

#### Scenario: Fresh clone

- **WHEN** someone clones the repository and runs the typecheck, lint, test, and database test scripts with no environment file and no cloud account
- **THEN** all of them can run and pass (the database scripts need Docker)
