# Spec Delta

## Purpose

Defines how Dayspoken stores the audio of each entry: a private bucket where only the owner can upload, read, and delete their own recording, with size and type limits, and playback through links that expire.

## ADDED Requirements

### Requirement: A private audio bucket

The database SHALL have a storage bucket named `audio`, and it SHALL be private. An audio file SHALL NOT be reachable through a public URL.

#### Scenario: Bucket exists and is private

- **WHEN** the database is created
- **THEN** the bucket `audio` exists and is not public

#### Scenario: Public URL

- **WHEN** someone requests the public URL of an uploaded audio file
- **THEN** the file is not returned

### Requirement: Object path

An audio object SHALL be named `{user_id}/{entry_id}.m4a`, where `user_id` is the signed-in user and `entry_id` is a uuid. Any other object name in the bucket SHALL be refused.

#### Scenario: Valid path

- **WHEN** user A uploads `{A}/{entry}.m4a`
- **THEN** the upload is accepted

#### Scenario: Another user's folder

- **WHEN** user A uploads `{B}/{entry}.m4a`
- **THEN** the upload is refused

#### Scenario: Wrong name

- **WHEN** user A uploads `{A}/notes.txt` or `{A}/{entry}.mp3`
- **THEN** the upload is refused

### Requirement: Upload only for an existing own entry

A user SHALL be able to upload audio only for an entry that already exists and belongs to them.

#### Scenario: Entry exists

- **WHEN** user A has an entry and uploads its audio
- **THEN** the upload is accepted

#### Scenario: No entry

- **WHEN** user A uploads audio for an entry id that does not exist
- **THEN** the upload is refused

#### Scenario: Entry of another user

- **WHEN** user A uploads audio for an entry that belongs to user B
- **THEN** the upload is refused

### Requirement: Owner-only access

A user SHALL be able to list, read, replace, and delete only the audio files in their own folder, and a replacement SHALL follow the same path and entry rules as an upload (so a failed upload can be retried at the same path). The server role SHALL be able to read and delete any audio file.

#### Scenario: Reading own file

- **WHEN** user A reads their own audio file
- **THEN** the file is returned

#### Scenario: Retrying an upload

- **WHEN** user A uploads the audio for an entry a second time, replacing the first file
- **THEN** the second upload is accepted and the file holds the new audio

#### Scenario: Replacing another user's file

- **WHEN** user A tries to replace a file in user B's folder
- **THEN** the request is refused

#### Scenario: Reading another file

- **WHEN** user A tries to read or delete a file in user B's folder
- **THEN** the request is refused or finds no file

#### Scenario: Server cleanup

- **WHEN** the server role deletes every file in a user's folder
- **THEN** the files are removed

### Requirement: Size and type limits

The bucket SHALL accept files of at most 5 MB and only these audio types: `audio/mp4`, `audio/x-m4a`, `audio/m4a`, and `audio/aac`. A three-minute recording at about 32 kbps (about 0.7 MB) SHALL fit.

#### Scenario: Normal recording

- **WHEN** a 0.7 MB `audio/mp4` file is uploaded
- **THEN** it is accepted

#### Scenario: Too large

- **WHEN** a 6 MB file is uploaded
- **THEN** it is refused

#### Scenario: Wrong type

- **WHEN** a PNG image is uploaded
- **THEN** it is refused

### Requirement: Playback through signed links

The owner of an audio file SHALL be able to create a signed link that works for a limited time and then stops working. A user SHALL NOT be able to create a signed link for a file in another user's folder.

#### Scenario: Link works, then expires

- **WHEN** the owner creates a link that lasts 60 seconds and opens it before and after that time
- **THEN** the file is returned the first time and refused the second time

#### Scenario: Link for another user's file

- **WHEN** user A asks for a signed link for a file in user B's folder
- **THEN** no link is created
