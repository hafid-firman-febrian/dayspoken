# Spec Delta

## Purpose

Defines the Dayspoken database: the tables, columns, constraints, search and embedding columns, and plan limits that every feature builds on, and how the schema is created, so the data stays valid whatever client or server code writes it.

## ADDED Requirements

### Requirement: The schema comes only from migrations

The database schema SHALL be created and changed only by timestamped SQL migration files kept in the repository. Applying every migration, in timestamp order, to an empty database SHALL produce the complete schema with no manual step.

#### Scenario: Fresh database

- **WHEN** every migration is applied to an empty database
- **THEN** all tables, types, indexes, functions, and policies exist, and no other step is needed

#### Scenario: Migration order

- **WHEN** two migrations are listed
- **THEN** the one with the earlier timestamp in its file name is applied first

### Requirement: Every user has a profile

Each user SHALL have exactly one profile row with the same id as the user. A profile SHALL hold `timezone` (default `UTC`), `plan` (default `free`, and it SHALL name an existing plan), `is_demo` (default false), an optional `reminder_time` (a time of day), and `created_at`.

#### Scenario: Profile created at sign-up

- **WHEN** a new user is created
- **THEN** a profile with the same id exists at once, with plan `free`, timezone `UTC`, `is_demo` false, and no reminder time

#### Scenario: Unknown plan

- **WHEN** a profile is given a plan that has no row in `plan_limits`
- **THEN** the change is rejected

#### Scenario: The global row is not a plan

- **WHEN** a profile is given the plan `global`
- **THEN** the change is rejected

#### Scenario: Invalid timezone

- **WHEN** a profile is given a timezone that is not a real time zone name, such as `Mars/Base`
- **THEN** the change is rejected, and a valid name such as `Asia/Jakarta` is accepted

### Requirement: Entry lifecycle status

An entry SHALL have a `status` that is one of `uploading`, `transcribing`, `analyzing`, `ready`, or `failed` (default `uploading`), an optional `error_code`, and an `embedding_status` that is one of `pending`, `ready`, or `failed` (default `pending`).

#### Scenario: Defaults

- **WHEN** an entry is created without a status
- **THEN** its status is `uploading` and its embedding status is `pending`

#### Scenario: Unknown status

- **WHEN** an entry is given the status `done`
- **THEN** the change is rejected

### Requirement: Entry capture fields

An entry SHALL belong to one user and hold `local_date` (the user's day), `recorded_at`, `duration_sec` (1 to 190), `audio_path`, an optional `language`, and an optional `prompt`. The `audio_path` SHALL be `{user_id}/{entry_id}.m4a` for that same entry and user.

#### Scenario: Valid entry

- **WHEN** an entry is created with a 95 second duration and the audio path `{user_id}/{entry_id}.m4a`
- **THEN** it is stored

#### Scenario: Audio path of another user

- **WHEN** an entry is created whose audio path starts with a different user id
- **THEN** it is rejected

#### Scenario: Duration out of range

- **WHEN** an entry is created with a duration of 0 or of 191 seconds
- **THEN** it is rejected

### Requirement: Entry AI fields

An entry SHALL hold optional `transcript`, `title`, and `summary`; an optional `mood` from 1 to 5; a `mood_source` of `ai` or `user`; and `tags`, a list of at most 5 lowercase, non-empty words. `mood` and `mood_source` SHALL be both set or both empty.

#### Scenario: Too many tags

- **WHEN** an entry is given 6 tags
- **THEN** it is rejected

#### Scenario: Uppercase tag

- **WHEN** an entry is given the tag `Work`
- **THEN** it is rejected

#### Scenario: Mood out of range

- **WHEN** an entry is given the mood 6
- **THEN** it is rejected

#### Scenario: Mood without a source

- **WHEN** an entry is given a mood and no mood source
- **THEN** it is rejected

### Requirement: Full-text search column

An entry SHALL have a search column that the database keeps in step with the title, summary, transcript, and tags, using the `simple` text search configuration (no language-specific stemming). The column SHALL be indexed.

#### Scenario: Word in the transcript

- **WHEN** an entry's transcript contains "presentation" and a search for "presentation" is run
- **THEN** the entry matches

#### Scenario: Title changes

- **WHEN** an entry's title is changed to contain "budget"
- **THEN** a search for "budget" matches it with no other step

#### Scenario: Tag

- **WHEN** an entry has the tag `family` and a search for "family" is run
- **THEN** the entry matches

### Requirement: Entry embedding column

An entry SHALL have one embedding of exactly 768 numbers (from `gemini-embedding-2`, cut to 768 dimensions), empty until it is computed. The column SHALL be indexed for cosine similarity search.

#### Scenario: Empty until computed

- **WHEN** an entry is created
- **THEN** its embedding is empty

#### Scenario: Wrong size

- **WHEN** an embedding of 100 numbers is stored
- **THEN** it is rejected

### Requirement: Timestamps

Every entry SHALL record `created_at` when it is created and `updated_at`, which SHALL change on every update.

#### Scenario: Update

- **WHEN** an entry is updated at a later time
- **THEN** its `updated_at` is later than before, and its `created_at` is unchanged

### Requirement: Ask logs

An ask log SHALL belong to one user and hold `local_date`, `question`, `answer`, `citations`, and `created_at`. `citations` SHALL be a list (default empty) of items with `entry_id` and `quote`.

#### Scenario: Default citations

- **WHEN** an ask log is created without citations
- **THEN** its citations are an empty list

#### Scenario: Citations that are not a list

- **WHEN** an ask log is given citations that are a single object instead of a list
- **THEN** it is rejected

### Requirement: Plan limits are configuration

The `plan_limits` table SHALL hold one row per plan with `recordings_per_day` and `asks_per_day` (whole numbers, zero or more), and one row named `global` with the caps for the whole app. The migrations SHALL create the rows `free` (3 recordings, 5 questions), `pro` (10 recordings, 50 questions), and `global`. Changing a value SHALL need no app release.

#### Scenario: Seeded values

- **WHEN** the database is created
- **THEN** `free` is 3 and 5, `pro` is 10 and 50, and `global` has both caps set

#### Scenario: Negative limit

- **WHEN** a limit is set to -1
- **THEN** it is rejected

#### Scenario: Changing a limit

- **WHEN** the `free` recordings limit is changed to 4 in the database
- **THEN** the next read returns 4 and nothing in the app needs to change

### Requirement: Removing a user removes their data

Removing an auth user SHALL remove their profile, entries, and ask logs. Their audio files are removed separately by the account deletion change.

#### Scenario: Cascade

- **WHEN** an auth user who has a profile, 2 entries, and 1 ask log is removed
- **THEN** none of those rows remain
