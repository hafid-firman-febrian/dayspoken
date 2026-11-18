# Spec Delta

## ADDED Requirements

### Requirement: The client keeps the session in secure storage

The client SHALL save the sign-in session through the app's encrypted session storage, SHALL refresh it in the background while the app is in the foreground, and SHALL NOT read sessions from URLs. It SHALL still be created only from the public URL and the publishable key, and it SHALL still be created lazily.

#### Scenario: Client options

- **WHEN** the client is created
- **THEN** session persistence and automatic token refresh are on, session detection in URLs is off, and the storage is the encrypted session storage

#### Scenario: Restored session

- **WHEN** the client is created and an encrypted session was saved earlier
- **THEN** the client has that session without a new sign-in

#### Scenario: Nothing is saved without a session

- **WHEN** the user has never signed in
- **THEN** nothing is written to the session storage

### Requirement: Background refresh follows the app state

The app SHALL start the client's automatic refresh when the app is in the foreground and stop it when the app goes to the background.

#### Scenario: Going to the background

- **WHEN** the app moves to the background
- **THEN** automatic refresh stops

#### Scenario: Coming back

- **WHEN** the app returns to the foreground
- **THEN** automatic refresh starts again

## REMOVED Requirements

### Requirement: No stored session yet

**Reason**: Secure session storage arrives with email sign-in (`add-email-otp-auth`), which was the planned reason for leaving the session off.

**Migration**: Replaced by "The client keeps the session in secure storage" and "Background refresh follows the app state". Code that relied on the client never holding a session now gets the signed-in user's session after sign-in, and the row-level security rules apply to that user.
