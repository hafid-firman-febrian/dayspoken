# Spec Delta

## Purpose

Defines the Welcome screen (S01), the first screen a signed-out visitor sees: what Dayspoken is, how to start, how to try the demo, and the notice about how audio is processed.

## ADDED Requirements

### Requirement: Welcome is the entry point for signed-out visitors

The app SHALL open on the Welcome screen when no user is signed in. The screen SHALL show the app name, a short value proposition, a "Get started" button, and a "Try the demo" button.

#### Scenario: First launch

- **WHEN** the app starts with no saved session
- **THEN** the Welcome screen is shown with the app name, the value proposition, "Get started", and "Try the demo"

#### Scenario: Get started

- **WHEN** the user presses "Get started"
- **THEN** the Sign In screen opens

### Requirement: Privacy notice about audio processing

The Welcome screen SHALL show a notice, before the user signs in, that audio is processed by Google Gemini's free tier and that sensitive information should not be recorded. The suggested copy is "This demo processes audio with Google Gemini's free tier. Avoid recording sensitive information." The notice SHALL be visible without scrolling on a screen of 640pt height or more.

#### Scenario: Notice is shown

- **WHEN** the Welcome screen is shown
- **THEN** the privacy notice text is on the screen next to the "Get started" button

#### Scenario: Notice does not hide behind an action

- **WHEN** the user has not pressed any button
- **THEN** the notice is already visible

### Requirement: Try the demo is a placeholder for now

Until the demo account exists, the "Try the demo" button SHALL be present and SHALL NOT sign the user in or start any request. Pressing it SHALL tell the user that the demo is coming soon, in a transient message, and leave the user on the Welcome screen.

#### Scenario: Pressing the placeholder

- **WHEN** the user presses "Try the demo"
- **THEN** a message says the demo is not available yet, no network request is made, and the Welcome screen stays open

### Requirement: Welcome follows the design system

The Welcome screen SHALL be built from the base UI components and semantic color tokens, SHALL read well in light and dark mode, SHALL keep text contrast at 4.5:1 or more, and SHALL give every button a visible label and a touch target of at least 44pt. All copy SHALL be in English.

#### Scenario: Dark mode

- **WHEN** the theme is dark
- **THEN** the Welcome screen uses the dark tokens and no element uses a fixed color

#### Scenario: Screen reader

- **WHEN** a screen reader reads the screen
- **THEN** the title is announced as a heading, and each button is announced with its label and the role button
