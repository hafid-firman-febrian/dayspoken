# row-level-security Specification

## Purpose

Defines who may read and write which rows, columns, and functions in the Dayspoken database, so a signed-in user reaches only their own data, an anonymous visitor reaches nothing, and the fields that the server owns cannot be forged by the app.

## Requirements

### Requirement: Row-level security on every table

Every table in the `public` schema SHALL have row-level security enabled. A database test SHALL fail when any such table does not.

#### Scenario: All tables protected

- **WHEN** the database tests list the tables in the `public` schema
- **THEN** every one of them has row-level security enabled

#### Scenario: A new table without protection

- **WHEN** a migration adds a table and does not enable row-level security
- **THEN** the database tests fail and name the table

### Requirement: Users reach only their own rows

A signed-in user SHALL be able to read only their own `profiles`, `entries`, and `ask_logs` rows, and to change or delete only their own entries. Another user's rows SHALL be invisible, not merely read-only.

#### Scenario: Another user's entries

- **WHEN** user A reads the entries table and user B has 3 entries
- **THEN** none of B's entries is returned

#### Scenario: Changing another user's entry

- **WHEN** user A tries to change or delete an entry of user B
- **THEN** no row is changed

### Requirement: Anonymous visitors have no table access

A visitor who is not signed in SHALL have no access to any table, for reading or writing.

#### Scenario: Anonymous read

- **WHEN** a visitor with only the publishable key reads `entries`, `profiles`, `ask_logs`, or `plan_limits`
- **THEN** the request is refused or returns no rows

#### Scenario: Anonymous write

- **WHEN** a visitor with only the publishable key inserts a row into any table
- **THEN** the request is refused

### Requirement: Profile edits are limited

A user SHALL be able to change only their own `timezone` and `reminder_time`. A user SHALL NOT change `plan` or `is_demo`, and SHALL NOT create or delete a profile directly.

#### Scenario: Changing the timezone

- **WHEN** a user sets their timezone to `Asia/Jakarta`
- **THEN** the change is stored

#### Scenario: Upgrading the plan

- **WHEN** a user tries to set their plan to `pro`
- **THEN** the change is refused and the plan stays `free`

### Requirement: Entry inserts carry capture fields only

A user SHALL be able to create an entry for themselves with only the capture fields: `id`, `local_date`, `recorded_at`, `duration_sec`, `audio_path`, and `prompt`. A user SHALL NOT set the status, the AI fields, the language, or the embedding, and SHALL NOT create an entry for another user.

#### Scenario: Normal entry

- **WHEN** a user creates an entry with the capture fields
- **THEN** it is stored for that user with status `uploading`

#### Scenario: Forging a result

- **WHEN** a user creates an entry that sets the status to `ready` or sets a transcript
- **THEN** the request is refused

#### Scenario: Entry for someone else

- **WHEN** a user creates an entry with another user's id
- **THEN** the request is refused

### Requirement: Entry edits are limited and keep the mood source honest

A user SHALL be able to change only the `title`, `mood`, and `tags` of their own entry, and only while its status is `ready`. When a user changes the mood, the mood source SHALL become `user`.

#### Scenario: Light edit

- **WHEN** a user changes the title and tags of a ready entry
- **THEN** the change is stored

#### Scenario: Editing while processing

- **WHEN** a user changes the title of an entry whose status is `analyzing`
- **THEN** no row is changed

#### Scenario: Mood edit

- **WHEN** a user changes the mood of a ready entry whose mood source is `ai`
- **THEN** the mood is stored and its source is `user`

#### Scenario: Other columns

- **WHEN** a user tries to change `status`, `transcript`, `summary`, or `embedding` of their entry
- **THEN** the request is refused

### Requirement: The server writes the processing results

The server role SHALL be able to write every column of every table. Only the server SHALL set `status`, `error_code`, `language`, `transcript`, `summary`, the AI mood and tags, the embedding, and `embedding_status`.

#### Scenario: Server completes an entry

- **WHEN** the server role sets an entry's status to `ready` with a transcript, title, summary, mood, and tags
- **THEN** the change is stored

### Requirement: Ask logs are read and deleted by their owner only

A user SHALL be able to read and delete their own ask logs. A user SHALL NOT create or change an ask log, because answers come from the server.

#### Scenario: Forged answer

- **WHEN** a user inserts an ask log for themselves
- **THEN** the request is refused

#### Scenario: Reading history

- **WHEN** a user reads ask logs
- **THEN** only their own are returned

### Requirement: Plan limits are readable and never writable by users

A signed-in user SHALL be able to read the rows of `plan_limits` for real plans, and SHALL NOT see the `global` row. No user SHALL be able to change `plan_limits`.

#### Scenario: Reading limits

- **WHEN** a signed-in user reads `plan_limits`
- **THEN** the `free` and `pro` rows are returned and the `global` row is not

#### Scenario: Raising a limit

- **WHEN** a signed-in user tries to update a row in `plan_limits`
- **THEN** the request is refused

### Requirement: Only ping is callable without signing in

No function in the `public` schema SHALL be callable by an anonymous visitor except `ping`. Functions that exist only to support triggers SHALL NOT be callable by users through the API at all.

#### Scenario: Ping

- **WHEN** a visitor with only the publishable key calls `ping`
- **THEN** it returns a success value

#### Scenario: Helper function

- **WHEN** a signed-in user or a visitor calls a trigger helper function through the API
- **THEN** the call is refused
