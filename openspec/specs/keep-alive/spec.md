# keep-alive Specification

## Purpose

Keeps the free Supabase project from being paused for low activity, by a scheduled daily call to the backend, and says plainly when the call fails or when the schedule itself can be switched off by GitHub.

## Requirements

### Requirement: A daily ping

A scheduled GitHub Actions workflow SHALL call the backend's `ping` function once a day, through the project's public URL with the publishable key, so the project gets database activity every day. The workflow SHALL also be runnable by hand.

#### Scenario: Scheduled run

- **WHEN** the daily schedule fires on the default branch
- **THEN** the workflow calls `ping` and succeeds when the backend answers with a success value

#### Scenario: Manual run

- **WHEN** the owner starts the workflow by hand from the Actions tab
- **THEN** it runs the same call

### Requirement: A failed ping is visible

The workflow SHALL fail when the backend does not answer with a success status, so that GitHub shows a failed run and notifies the owner. It SHALL retry a few times before it fails.

#### Scenario: Project paused

- **WHEN** the project is paused and the request returns an error
- **THEN** the run fails after its retries

### Requirement: Public values and no extra rights

The workflow SHALL read the URL and the publishable key from repository variables, SHALL NOT use any secret, and SHALL run with no permission on the repository.

#### Scenario: No secrets

- **WHEN** the workflow file is read
- **THEN** it references no secret and asks for no repository permission

### Requirement: It does nothing where it is not configured

When the repository variables are not set (for example in a fork), the workflow SHALL skip its call and SHALL NOT fail.

#### Scenario: Fork without variables

- **WHEN** the workflow runs in a repository that has no `SUPABASE_URL` variable
- **THEN** the job is skipped and the run is not marked as failed

### Requirement: The schedule's limits are documented

`STRUCTURE.md` SHALL state that GitHub runs scheduled workflows only on the default branch, and switches them off after 60 days without repository activity, and SHALL say how to switch the workflow back on.

#### Scenario: Reading the docs

- **WHEN** someone reads the keep-alive section of `STRUCTURE.md`
- **THEN** it names the 60-day rule and the steps to re-enable the workflow
