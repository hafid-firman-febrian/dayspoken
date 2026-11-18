# app-env-config Specification

## Purpose

Defines how the Dayspoken app receives its configuration: only public `EXPO_PUBLIC_*` values, read through one typed and validated entry point, so no secret can reach the app bundle and a bad value fails clearly instead of silently.

## Requirements

### Requirement: Only public values reach the app

The app SHALL read configuration only from environment variables whose names start with `EXPO_PUBLIC_`. Secrets (AI keys, SMTP credentials, service-role keys) SHALL never be configured for the app.

#### Scenario: A public variable is available to the app

- **WHEN** `EXPO_PUBLIC_APP_ENV` is set in the environment used to start or build the app
- **THEN** the app can read its value through the env module

#### Scenario: A non-public variable is not available to the app

- **WHEN** a variable without the `EXPO_PUBLIC_` prefix is set in the environment used to start or build the app
- **THEN** the app does not expose that variable through the env module

### Requirement: One entry point for configuration

App code (routes and everything under `src/`) SHALL read environment values only through the env module in `src/lib`. Direct access to `process.env` anywhere else in app code SHALL be reported as a lint error.

#### Scenario: Direct environment access outside the env module

- **WHEN** a file in `app/` or `src/`, other than the env module, reads `process.env`
- **THEN** `npm run lint` fails with an error on that line

#### Scenario: Access through the env module

- **WHEN** app code imports the typed config from the env module
- **THEN** `npm run lint` and `npm run typecheck` pass

### Requirement: Values are validated with clear errors

The env module SHALL validate every value against its expected type and allowed values. An invalid value SHALL raise an error that names the variable and the allowed values. A missing optional value SHALL fall back to its documented default.

#### Scenario: Invalid value

- **WHEN** `EXPO_PUBLIC_APP_ENV` is set to `staging`
- **THEN** the env module throws an error that names `EXPO_PUBLIC_APP_ENV` and lists `development` and `production` as the allowed values

#### Scenario: Missing optional value

- **WHEN** `EXPO_PUBLIC_APP_ENV` is not set
- **THEN** the env module returns `development` for it

#### Scenario: Valid value

- **WHEN** `EXPO_PUBLIC_APP_ENV` is set to `production`
- **THEN** the env module returns `production` with a type limited to `development | production`

### Requirement: Variables are documented and local values stay local

The repository SHALL contain a committed `.env.example` that lists every variable the env module reads, with a short comment and an example value for each. Local env files (`.env`, `.env*.local`) SHALL be ignored by Git.

#### Scenario: Every variable is documented

- **WHEN** a variable is added to the env module
- **THEN** `.env.example` lists the same variable with a comment and an example value

#### Scenario: Local env files are not committed

- **WHEN** a developer creates `.env` or `.env.local` in the repository root
- **THEN** `git status` does not list the file as untracked

### Requirement: Supabase connection values

The env module SHALL expose the backend URL and the publishable key, read from `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Both are optional, so the app starts without them, but when one is set the other SHALL be set too.

#### Scenario: Both set

- **WHEN** both variables hold valid values
- **THEN** the env module returns both

#### Scenario: Neither set

- **WHEN** neither variable is set
- **THEN** the env module returns no Supabase values and does not throw

#### Scenario: Only one set

- **WHEN** only `EXPO_PUBLIC_SUPABASE_URL` is set
- **THEN** the env module throws an error that names `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as missing

### Requirement: Only a publishable key is accepted

`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` SHALL start with `sb_publishable_`. A secret key (starting with `sb_secret_`) SHALL be refused with an error that says it is a secret and must never be in the app. Any other value SHALL be refused with an error that names the variable and the required prefix. An error SHALL NOT repeat the key it refused.

#### Scenario: Publishable key

- **WHEN** the variable holds a value that starts with `sb_publishable_`
- **THEN** the env module accepts it

#### Scenario: Secret key

- **WHEN** the variable holds a value that starts with `sb_secret_`
- **THEN** the env module throws an error that says it is a secret key, and the error text does not contain the key

#### Scenario: Old anon key

- **WHEN** the variable holds a legacy key that does not start with `sb_publishable_`
- **THEN** the env module throws an error that names the variable and the prefix `sb_publishable_`

### Requirement: The backend URL is a web address

`EXPO_PUBLIC_SUPABASE_URL` SHALL be a valid `http` or `https` URL. When `EXPO_PUBLIC_APP_ENV` is `production`, it SHALL be `https`.

#### Scenario: Local URL in development

- **WHEN** the app environment is `development` and the URL is `http://10.0.2.2:54321`
- **THEN** the env module accepts it

#### Scenario: Not a URL

- **WHEN** the URL variable holds `not a url`
- **THEN** the env module throws an error that names `EXPO_PUBLIC_SUPABASE_URL`

#### Scenario: Plain http in production

- **WHEN** the app environment is `production` and the URL starts with `http://`
- **THEN** the env module throws an error that says production needs `https`

### Requirement: Supabase variables are documented with examples

`.env.example` SHALL list `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with a comment and an example for the local backend and for the cloud project, including the address to use from an Android emulator.

#### Scenario: Reading the example file

- **WHEN** a developer opens `.env.example`
- **THEN** both variables are listed, with a local example, a cloud example, and a note that an Android emulator reaches the computer at `10.0.2.2`
