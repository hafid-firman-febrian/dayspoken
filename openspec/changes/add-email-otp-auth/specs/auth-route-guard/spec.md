# Spec Delta

## Purpose

Defines which screens a signed-out and a signed-in user can reach, and how the app moves between the auth screens and the rest of the app when the sign-in state changes.

## ADDED Requirements

### Requirement: Signed-out users reach only the auth screens

When no user is signed in, the app SHALL allow only the Welcome, Sign In, and Verify Code screens. Opening any other route, including from a deep link, SHALL lead to the Welcome screen.

#### Scenario: Deep link while signed out

- **WHEN** a signed-out user opens a link to a signed-in route
- **THEN** the Welcome screen is shown and the signed-in screen is not rendered

#### Scenario: Auth routes

- **WHEN** a signed-out user navigates between Welcome, Sign In, and Verify Code
- **THEN** each screen opens normally

### Requirement: Signed-in users never see the auth screens

When a user is signed in, the app SHALL NOT show the Welcome, Sign In, or Verify Code screens. Opening one of them, including from a deep link, SHALL lead to the signed-in home route.

#### Scenario: Deep link while signed in

- **WHEN** a signed-in user opens a link to the Sign In screen
- **THEN** the signed-in home route is shown instead

### Requirement: Signing in and out moves the user at once

When the sign-in state changes, the app SHALL move the user to the matching area without a restart and without a manual step. After signing in the back button SHALL NOT return to an auth screen, and after signing out it SHALL NOT return to a signed-in screen.

#### Scenario: Sign in

- **WHEN** the user enters a correct code
- **THEN** the app shows the signed-in home route and the auth screens are removed from the back stack

#### Scenario: Session ends elsewhere

- **WHEN** the session is revoked while the app is open and the refresh fails
- **THEN** the app moves to the Welcome screen

### Requirement: No flash of the wrong screen at launch

While the saved session is being read at launch, the app SHALL keep the splash screen up and SHALL NOT render any route. Once the state is known, the first screen shown SHALL be the right one for it.

#### Scenario: Returning user

- **WHEN** a signed-in user opens the app
- **THEN** the splash screen is replaced directly by the signed-in home route, with no frame of the Welcome screen

#### Scenario: Reading fails

- **WHEN** reading the saved session fails
- **THEN** the splash screen is replaced by the Welcome screen, and the app does not stay on the splash screen

### Requirement: The development gallery stays reachable in development

The component gallery route SHALL stay reachable in a development build for both signed-in and signed-out users, so the design system can be checked without an account. In a production build it SHALL behave as before and not be reachable.

#### Scenario: Gallery while signed out in development

- **WHEN** a signed-out user opens the gallery route in a development build
- **THEN** the gallery is shown

#### Scenario: Production build

- **WHEN** the gallery route is opened in a production build
- **THEN** it redirects as before and the gallery is not shown
