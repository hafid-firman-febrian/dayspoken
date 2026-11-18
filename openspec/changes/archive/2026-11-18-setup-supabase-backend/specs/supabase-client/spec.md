# Spec Delta

## Purpose

Defines the Supabase client that the Dayspoken app uses to reach its backend: typed with the generated data types, built only from public values, failing clearly when it is not configured, and not yet storing any sign-in session.

## ADDED Requirements

### Requirement: One typed client for the app

The app SHALL have one function in `src/lib` that returns the Supabase client. The client SHALL be built from the public URL and the publishable key read through the env module, SHALL be typed with the generated database types, and SHALL be the same object on every call.

#### Scenario: Same client

- **WHEN** the function is called twice
- **THEN** it returns the same client both times

#### Scenario: Typed access

- **WHEN** code reads the `entries` table through the client and selects a column that does not exist
- **THEN** the typecheck fails

### Requirement: Clear error when it is not configured

When the Supabase URL or the publishable key is missing, getting the client SHALL throw an error that names both variables and says to copy `.env.example`. The app SHALL still start, and the tests and the continuous integration SHALL still pass, with neither variable set.

#### Scenario: Missing values

- **WHEN** code asks for the client and no Supabase variable is set
- **THEN** the error names `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

#### Scenario: App starts without them

- **WHEN** the app starts with no Supabase variable and no code asks for the client
- **THEN** the app opens as before

### Requirement: Public values only

The client SHALL use only the publishable key. It SHALL NOT be created with a secret key, and a secret key SHALL be refused before any client exists.

#### Scenario: Secret key in the environment

- **WHEN** `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` holds a secret key
- **THEN** the env module throws and no client is created

### Requirement: No stored session yet

The client SHALL NOT save a sign-in session on the device and SHALL NOT refresh one in the background. Secure session storage is added by the sign-in change.

#### Scenario: Client options

- **WHEN** the client is created
- **THEN** session persistence, automatic token refresh, and session detection in URLs are all off

### Requirement: The client reaches the backend

With a running backend and the matching URL and key, the client SHALL be able to call the backend from a development build.

#### Scenario: Ping

- **WHEN** the local backend is running, the variables point to it, and the client calls `ping`
- **THEN** the call succeeds and returns a success value

#### Scenario: Protected table

- **WHEN** the client, not signed in, reads `entries`
- **THEN** it gets no rows (or a permission error), never another user's data
