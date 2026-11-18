# Spec Delta

## Purpose

Defines how sign-in codes reach a user's inbox: the code format and lifetime, the email that carries it, the free SMTP service that sends it, where its credentials live, and the sending limits the app must respect.

## ADDED Requirements

### Requirement: The code is six digits and short-lived

The backend SHALL issue a 6-digit numeric code for email sign-in. A code SHALL stay valid for 10 minutes, and a user SHALL be able to request a new one no sooner than 60 seconds after the previous one. A new code SHALL make the previous one unusable.

#### Scenario: Code format

- **WHEN** a code is requested
- **THEN** the email holds exactly six digits

#### Scenario: Expiry

- **WHEN** a code is entered 11 minutes after it was sent
- **THEN** the backend rejects it

#### Scenario: Too soon to resend

- **WHEN** the same address asks for another code within 60 seconds
- **THEN** the backend refuses with a rate-limit answer and sends no email

#### Scenario: Newest code wins

- **WHEN** a second code was sent and the first code is entered
- **THEN** the backend rejects the first code

### Requirement: The email shows the code, not a link

The sign-in email SHALL show the code in large, copyable text with a short line about its lifetime and a line saying it can be ignored when the user did not ask for it. It SHALL contain no sign-in link. The same email SHALL be sent to an address that already has an account and to one that does not.

#### Scenario: Existing account

- **WHEN** a code is requested for an address with an account
- **THEN** the email contains the code and no sign-in link

#### Scenario: New account

- **WHEN** a code is requested for an address with no account
- **THEN** the email contains the code and no confirmation link, and entering the code signs the user in

### Requirement: A new user needs no extra confirmation

Entering the code for a new address SHALL create the account and sign the user in, with no separate "confirm your email" step. The user's profile row SHALL exist right after the first sign-in.

#### Scenario: First sign-in

- **WHEN** a new address enters a correct code
- **THEN** the user is signed in and a profile row exists for them

### Requirement: Codes are sent through free SMTP, not the built-in email

In the cloud project the backend SHALL send sign-in emails through a free SMTP service (a Gmail app password or a Brevo free account). It SHALL NOT rely on the built-in email service, which allows only 2 messages per hour and only to members of the project's organization. The sender name SHALL be "Dayspoken".

#### Scenario: Any address

- **WHEN** a code is requested for an address that is not a member of the project's organization
- **THEN** the email is delivered

#### Scenario: Sender

- **WHEN** the email arrives
- **THEN** it shows "Dayspoken" as the sender name

### Requirement: SMTP credentials are secrets

SMTP credentials SHALL exist only as Supabase secrets or in local files that Git ignores. They SHALL NOT appear in the repository, the app bundle, a workflow file, a log, or a chat. The committed backend configuration SHALL refer to them only by variable name.

#### Scenario: Repository scan

- **WHEN** the repository is searched for the SMTP password
- **THEN** it is not found in any tracked file

#### Scenario: Configuration references

- **WHEN** the committed backend configuration is read
- **THEN** the SMTP user and password are read from environment variables

### Requirement: Local development needs no SMTP

The local stack SHALL deliver sign-in emails to its built-in test mailbox, so a developer can sign in without an SMTP account, and the code can be read there.

#### Scenario: Local sign-in

- **WHEN** a code is requested against the local stack
- **THEN** the email appears in the local test mailbox with its six-digit code

### Requirement: Sending limits are known and set

The backend SHALL allow at least 30 sign-in emails per hour for the whole project once custom SMTP is on, and SHALL limit requests per address and per IP so that code guessing and email flooding are slowed. The documented limits of the chosen SMTP provider (emails per day) SHALL be written down with the date they were checked.

#### Scenario: Limits documented

- **WHEN** a developer reads the auth setup notes
- **THEN** they find the project's hourly email limit, the provider's daily limit, and the date those were checked

#### Scenario: Provider limit reached

- **WHEN** the provider refuses to send more email
- **THEN** the app shows its generic "could not send the code, try again" message, with no raw error

### Requirement: Setup is documented and repeatable

The repository SHALL contain a short guide that gets the owner from nothing to working sign-in emails in the cloud project: creating the SMTP account, the app password or API key, setting the secrets, pushing the auth configuration, and testing with a real address. It SHALL warn that the built-in email works only for the organization's members.

#### Scenario: Following the guide

- **WHEN** the owner follows the guide on a new cloud project
- **THEN** a code arrives at an address outside the organization
