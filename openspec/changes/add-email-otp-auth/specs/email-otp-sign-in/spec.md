# Spec Delta

## Purpose

Defines how a user signs in with a 6-digit code sent to their email: the Sign In screen (S02), the Verify Code screen (S03), and every state a user can meet on the way. The same flow creates the account on first use.

## ADDED Requirements

### Requirement: Sign In asks for an email address

The Sign In screen SHALL show one email field and one button that sends the code. The address SHALL be trimmed and compared in lowercase before it is used. The keyboard SHALL be an email keyboard with no autocapitalization.

#### Scenario: Valid address

- **WHEN** the user types `Ada@Example.com ` and presses the send button
- **THEN** a code is requested for `ada@example.com`

#### Scenario: Keyboard

- **WHEN** the email field is focused
- **THEN** it offers an email keyboard and does not capitalize the first letter

### Requirement: Invalid email is caught before any request

When the text in the email field is not a valid address, pressing the send button SHALL show an error under the field, mark the field as invalid, and send nothing. The error SHALL clear as soon as the user edits the field.

#### Scenario: Not an address

- **WHEN** the user types `ada@` and presses the send button
- **THEN** the field shows "Enter a valid email address.", and no request is made

#### Scenario: Empty field

- **WHEN** the user presses the send button with an empty field
- **THEN** the field shows the same error, and no request is made

#### Scenario: Editing clears the error

- **WHEN** the field shows the error and the user types a character
- **THEN** the error disappears

### Requirement: Sending shows a loading state

While a code is being requested, the send button SHALL show a loading state and ignore presses, and the email field SHALL be read-only. A second request SHALL NOT start until the first finishes.

#### Scenario: Double press

- **WHEN** the user presses the send button twice quickly
- **THEN** only one code is requested

#### Scenario: Waiting

- **WHEN** the request is in progress
- **THEN** the button shows a spinner and the field cannot be edited

### Requirement: A code is emailed and Verify Code opens

When the request succeeds, the app SHALL open the Verify Code screen with the address the code was sent to, and SHALL show that address on the screen so the user can see where to look. A first-time address SHALL get an account, so signing in and signing up are the same action.

#### Scenario: Known address

- **WHEN** a code is requested for an address that already has an account
- **THEN** the Verify Code screen opens and shows the address

#### Scenario: New address

- **WHEN** a code is requested for an address with no account
- **THEN** an account is created for it and the Verify Code screen opens

### Requirement: Sending failures are explained

When the request fails, the user SHALL stay on the Sign In screen and see a message that says what to do next. Rate limiting SHALL say that too many codes were requested and to try again in a little while. A missing connection SHALL say that the user is offline. Any other failure SHALL say that the code could not be sent and to try again. No message SHALL show a raw server error.

#### Scenario: Rate limited

- **WHEN** the server answers that too many emails were requested
- **THEN** the screen says too many codes were requested and to try again later, and the email field keeps its text

#### Scenario: Offline

- **WHEN** the device has no connection
- **THEN** the screen says the user is offline and the email field keeps its text

#### Scenario: Unknown failure

- **WHEN** the request fails for any other reason
- **THEN** the screen shows a generic "could not send the code, try again" message and no raw error text

### Requirement: Verify Code takes a 6-digit code

The Verify Code screen SHALL show a 6-digit code input that accepts digits only, accepts a pasted code, and supports the system's one-time-code autofill. The code SHALL be checked automatically as soon as the sixth digit is entered, and the input SHALL be disabled while it is checked.

#### Scenario: Typing the code

- **WHEN** the user enters six digits
- **THEN** the code is checked without pressing another button, and the input is disabled until the answer arrives

#### Scenario: Pasting a code with spaces

- **WHEN** the user pastes `123 456`
- **THEN** the input holds `123456` and the code is checked once

#### Scenario: Correct code

- **WHEN** the code is correct
- **THEN** the user is signed in and leaves the auth screens

### Requirement: Wrong code is shown on the field

When the code is wrong, the input SHALL show an error ("That code is not right. Check it and try again."), SHALL clear the digits, and SHALL focus the input again. The user SHALL be able to try again with the same code that was sent.

#### Scenario: Wrong code

- **WHEN** the user enters a code that does not match
- **THEN** the field shows the wrong-code error, the digits are cleared, and the user can type again

#### Scenario: Error clears

- **WHEN** the wrong-code error is shown and the user types a digit
- **THEN** the error disappears

### Requirement: Expired code is told apart from a wrong code

The app SHALL treat a code as expired when more than the code lifetime has passed since it was sent. An expired code SHALL show its own message ("This code has expired. Send a new one.") and SHALL offer the resend action, not just a retry. The code lifetime SHALL equal the lifetime configured in the backend.

#### Scenario: Expired

- **WHEN** a code is entered after its lifetime has passed and the server rejects it
- **THEN** the screen shows the expired-code message and the resend button is enabled

#### Scenario: Rejected within the lifetime

- **WHEN** the server rejects a code that is still within its lifetime
- **THEN** the screen shows the wrong-code message, not the expired one

#### Scenario: App was in the background

- **WHEN** the user leaves the app for longer than the code lifetime and comes back
- **THEN** the screen already treats the code as expired

### Requirement: Resend has a timer

After a code is sent, the resend action SHALL stay disabled for 60 seconds and show the time left ("Resend code in 0:45"). The countdown SHALL follow the clock, not a counter, so it stays right after the app was in the background. When it reaches zero the action SHALL become enabled. Sending again SHALL restart the timer, replace the previous code, and clear any error on the code input.

#### Scenario: Countdown

- **WHEN** the Verify Code screen opens
- **THEN** the resend action is disabled and shows the seconds left, counting down to zero

#### Scenario: Resend

- **WHEN** the timer is at zero and the user presses "Resend code"
- **THEN** a new code is requested, the timer restarts at 60 seconds, and the digits and any error are cleared

#### Scenario: Resend refused by the server

- **WHEN** the server refuses a resend because of rate limiting
- **THEN** the screen says too many codes were requested, and the timer restarts

### Requirement: The user can go back and change the address

The Verify Code screen SHALL offer a way back to Sign In to correct the address. Going back SHALL keep the typed address in the field.

#### Scenario: Wrong address

- **WHEN** the user notices a typo and presses back on the Verify Code screen
- **THEN** the Sign In screen shows the address that was typed

### Requirement: Failures while checking are explained

When checking the code fails for a reason other than a wrong or expired code (no connection, rate limiting, or any other failure), the screen SHALL keep the digits, explain what happened in plain words, and let the user press the check again. No message SHALL show a raw server error.

#### Scenario: Offline while checking

- **WHEN** the device is offline when the sixth digit is entered
- **THEN** the screen says the user is offline, keeps the digits, and offers a retry

### Requirement: Screens follow the design system

The Sign In and Verify Code screens SHALL be built from the base UI components and semantic color tokens, SHALL work in light and dark mode, SHALL keep text contrast at 4.5:1 or more, and SHALL stay usable when the keyboard is open. Errors SHALL be announced to screen readers. All copy SHALL be in English.

#### Scenario: Keyboard open

- **WHEN** the keyboard is open on a small phone
- **THEN** the field, the error, and the button are still reachable

#### Scenario: Error announced

- **WHEN** an error appears under a field
- **THEN** a screen reader announces it
