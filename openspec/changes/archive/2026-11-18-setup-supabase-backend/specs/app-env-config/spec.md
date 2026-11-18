# Spec Delta

## ADDED Requirements

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
