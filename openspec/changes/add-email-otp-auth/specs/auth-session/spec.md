# Spec Delta

## Purpose

Defines how a signed-in session lives on the device: stored so that other apps and a copied file cannot read it, restored when the app opens, kept fresh while the app is in use, and ended completely by sign out.

## ADDED Requirements

### Requirement: The session is stored encrypted

The app SHALL save the sign-in session on the device only in encrypted form. The encryption key SHALL be kept in the platform's secure key storage (Keychain on iOS, Keystore on Android), never in the same place as the encrypted data and never in the source code, the environment, or a log. The session SHALL NOT be saved in plain preferences storage.

#### Scenario: Session saved

- **WHEN** the user signs in
- **THEN** the session is written to the encrypted store and the stored bytes do not contain the access token as readable text

#### Scenario: Key location

- **WHEN** the encrypted store is opened
- **THEN** its key comes from the secure key storage

### Requirement: The session is restored on launch

When the app starts and a valid saved session exists, the user SHALL be signed in without entering a code. The app SHALL NOT show the auth screens while it reads the saved session.

#### Scenario: Returning user

- **WHEN** a user who signed in earlier opens the app
- **THEN** the app opens on the signed-in route, and the Welcome screen is never shown

#### Scenario: No session

- **WHEN** the app starts with nothing saved
- **THEN** the user is signed out and sees the Welcome screen

### Requirement: The session is refreshed while the app is in use

While the app is in the foreground the session SHALL be refreshed before it expires. While the app is in the background the refresh SHALL stop, and it SHALL resume when the app returns to the foreground.

#### Scenario: Foreground

- **WHEN** the access token is close to expiring and the app is in the foreground
- **THEN** the session is renewed and the user stays signed in

#### Scenario: Background and back

- **WHEN** the app goes to the background and returns after the token expired
- **THEN** the session is renewed on return, without asking for a code

### Requirement: An unreadable or revoked session signs the user out

When the saved session cannot be read (the key is missing or changed, or the data is damaged), or the server no longer accepts it (the user was deleted or the refresh token was revoked), the app SHALL discard it and treat the user as signed out. The app SHALL NOT crash and SHALL NOT loop.

#### Scenario: Key is gone

- **WHEN** the encryption key is no longer in the secure key storage, for example after a restore to a new device
- **THEN** the old data is discarded, the user is signed out, and the Welcome screen is shown

#### Scenario: Refresh token revoked

- **WHEN** the server rejects the refresh token
- **THEN** the session is removed and the user is sent to the auth screens

#### Scenario: Offline at launch

- **WHEN** the app starts offline with a saved session
- **THEN** the user stays signed in, and a refresh failure caused only by the missing connection does not sign the user out

### Requirement: Sign out removes the session

Signing out SHALL remove the saved session from the device, SHALL end the session for this device on the server, and SHALL send the user to the Welcome screen. Signing out SHALL still leave the device signed out when the connection fails. Signing out on this device SHALL NOT end the sessions of other devices.

#### Scenario: Sign out online

- **WHEN** the signed-in user signs out
- **THEN** the stored session is gone and the Welcome screen is shown

#### Scenario: Sign out offline

- **WHEN** the device has no connection and the user signs out
- **THEN** the stored session is still removed and the Welcome screen is shown

#### Scenario: Back button after sign out

- **WHEN** the user has signed out and presses back
- **THEN** no signed-in screen is shown

#### Scenario: Other devices

- **WHEN** the user signs out on one device
- **THEN** a session on another device stays valid

### Requirement: Sign out is reachable from the app for now

Until Settings exists, the signed-in placeholder screen SHALL show a "Sign out" button, so the sign-out behavior can be used and checked. The button SHALL show a loading state while it works.

#### Scenario: Temporary button

- **WHEN** a signed-in user opens the placeholder home screen
- **THEN** a "Sign out" button is shown, and pressing it signs the user out

### Requirement: No token or code is written to logs

The app SHALL NOT write access tokens, refresh tokens, one-time codes, or the encryption key to any log, error message, or crash report.

#### Scenario: Failed sign-in

- **WHEN** checking a code fails
- **THEN** nothing logged or shown contains the code the user typed or any token
