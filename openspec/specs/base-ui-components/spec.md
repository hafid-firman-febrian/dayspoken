# base-ui-components Specification

## Purpose

Defines the shared base components that every Dayspoken screen is built from (layout, text, actions, inputs, feedback, and overlays), with their states and accessibility guarantees, so feature screens look and behave the same way.

## Requirements

### Requirement: Base component set

The app SHALL provide these base components from one public entry point: Screen, Text, Button, IconButton, TextField, CodeInput, Card, Chip, BottomSheet, Dialog, Toast, EmptyState, ErrorState, Banner, Skeleton, SectionHeader, and Icon. Each SHALL take its colors only from the semantic tokens and SHALL render correctly in light and dark mode.

#### Scenario: Importing a component

- **WHEN** feature code imports `Button` from the base UI entry point
- **THEN** the import resolves, and typecheck passes

#### Scenario: Rendering in both modes

- **WHEN** each base component's tests render it in light mode and in dark mode
- **THEN** it renders without errors in both

### Requirement: Base components hold no business logic

Base components SHALL NOT fetch data, call Supabase, or import feature code. Importing feature code from the base UI folder SHALL fail lint.

#### Scenario: Feature import in base UI

- **WHEN** a file in `src/ui/` imports from `@/features/...`
- **THEN** `npm run lint` fails on that import

### Requirement: Every base component has component tests

Each base component SHALL have a component test next to it that covers its states and its accessibility (role, label, and state). `npm test` SHALL run these tests.

#### Scenario: A component without its behavior

- **WHEN** Button no longer calls `onPress` when it is pressed
- **THEN** `npm test` fails

### Requirement: Touch targets

Every pressable base component SHALL have a touch target of at least 44 by 44 points, even when its visible shape is smaller.

#### Scenario: Small icon button

- **WHEN** an IconButton with a 20pt icon is rendered
- **THEN** its touch area is at least 44 by 44 points

### Requirement: Reduced motion

Base components that animate SHALL follow the system "reduce motion" setting: looping animations SHALL stop, and enter or exit motion SHALL be reduced to a fade or removed.

#### Scenario: Skeleton with reduce motion

- **WHEN** the system "reduce motion" setting is on and a Skeleton is shown
- **THEN** it renders as a static block without a pulse

### Requirement: Screen

Screen SHALL fill the display with the `background` token, respect the safe areas, and inset its content by the 20pt screen gutter by default. It SHALL support scrolling content and a variant without the gutter.

#### Scenario: Default screen

- **WHEN** a Screen is rendered on a device with a notch
- **THEN** its content starts below the status area and is inset 20pt from the left and right edges

#### Scenario: Scrolling content

- **WHEN** a scrolling Screen holds more content than fits on the display
- **THEN** the content scrolls, and tapping a button inside it works while the keyboard is open

### Requirement: Text

Text SHALL render one of the type styles (display, title, heading, body, reading, caption, small caption) in Geist, with a tone of `foreground` (default), `muted`, `accent`, or `on-primary`. Display, title, and heading SHALL be exposed to screen readers as headers. Text SHALL scale with the system font size.

#### Scenario: Heading role

- **WHEN** a Text with the title style is rendered
- **THEN** a screen reader announces it as a header

#### Scenario: Muted tone

- **WHEN** a Text with the muted tone is rendered in dark mode
- **THEN** its color is the dark `muted` token

#### Scenario: Large system font

- **WHEN** the system font size is set to the largest setting
- **THEN** body text grows with it

### Requirement: Text inside a hero card

Text inside a hero card SHALL default to the `on-primary` tone, so text on the primary color is white without each Text setting it.

#### Scenario: Text in a hero card

- **WHEN** a Text without a tone is rendered inside a hero Card
- **THEN** its color is the `on-primary` token

### Requirement: Button

Button SHALL be a pill with a visible text label, in the variants primary (`primary` fill, `on-primary` text), secondary (`surface` fill with a `border` outline, `foreground` text), and ghost (no fill, `accent` text). It SHALL support an optional leading icon, a small size, a full-width layout, and disabled and loading states.

#### Scenario: Press

- **WHEN** an enabled Button is pressed
- **THEN** its `onPress` is called once

#### Scenario: Disabled

- **WHEN** a disabled Button is pressed
- **THEN** `onPress` is not called, and a screen reader announces it as a dimmed button

#### Scenario: Loading

- **WHEN** a Button is loading
- **THEN** it shows a progress indicator in place of its icon, keeps its width, ignores presses, and a screen reader announces it as busy

### Requirement: IconButton

IconButton SHALL show one icon without text and SHALL require an accessibility label. It SHALL offer the variants plain, surface, primary, fab (the record button colors), and inverse (an `on-primary` fill with a `primary` icon, for use on a hero card).

#### Scenario: Label is required

- **WHEN** a developer renders an IconButton without an accessibility label
- **THEN** typecheck fails

#### Scenario: Screen reader

- **WHEN** a screen reader focuses an IconButton with the label "Record"
- **THEN** it announces "Record, button"

#### Scenario: FAB colors in dark mode

- **WHEN** an IconButton with the fab variant is rendered in dark mode
- **THEN** its fill is the dark `fab` token and its icon is the dark `on-fab` token

### Requirement: TextField

TextField SHALL show a visible label above the input, and optional placeholder and helper text. In the error state it SHALL show the error message with an icon and announce it. It SHALL support a disabled state, a multiline mode, and keyboard handling inside a BottomSheet.

#### Scenario: Label

- **WHEN** a TextField with the label "Email" is rendered
- **THEN** "Email" is visible, and a screen reader announces the input as "Email"

#### Scenario: Error

- **WHEN** a TextField receives the error "Enter a valid email address"
- **THEN** the message is shown under the input with an icon, and a screen reader announces it

#### Scenario: Focus

- **WHEN** the input gains focus
- **THEN** its outline changes to the `accent` token

#### Scenario: Inside a bottom sheet

- **WHEN** a TextField inside an open BottomSheet gains focus
- **THEN** the sheet moves up so the input stays visible above the keyboard

### Requirement: CodeInput

CodeInput SHALL collect a numeric code of a fixed length (default 6) as separate digit cells backed by one input. It SHALL accept pasted and autofilled codes, call a completion callback once all digits are entered, and support error and disabled states.

#### Scenario: Typing a full code

- **WHEN** the user types six digits
- **THEN** each digit shows in its own cell, and the completion callback receives the six-digit string once

#### Scenario: Pasting a code

- **WHEN** the user pastes "123456"
- **THEN** all six cells fill, and the completion callback receives "123456"

#### Scenario: Non-digits are ignored

- **WHEN** the user pastes "12a4 56"
- **THEN** only the digits are kept: "12456"

#### Scenario: One-time code autofill

- **WHEN** the operating system offers a one-time code from an email or message
- **THEN** CodeInput accepts it as the code

#### Scenario: Error state

- **WHEN** CodeInput is in the error state with the message "That code is not right"
- **THEN** the message is shown and announced, and the cells use an error outline

#### Scenario: Screen reader

- **WHEN** a screen reader focuses CodeInput with three digits entered
- **THEN** it announces one field with its label and the digits entered so far, not six separate fields

### Requirement: Card

Card SHALL be a container with the `surface` fill, a 22pt radius, and padding. The hero variant SHALL use the `primary` fill and a 30pt radius. A pressable Card SHALL behave as one button.

#### Scenario: Pressable card

- **WHEN** a Card with `onPress` is pressed
- **THEN** `onPress` is called, and a screen reader announces the card as a button

#### Scenario: Hero card

- **WHEN** a hero Card is rendered
- **THEN** its fill is the `primary` token and its corner radius is 30pt

### Requirement: Chip

Chip SHALL be a pill with a required text label, an optional leading icon, and an optional color dot that takes a token such as `mood-2`. A selectable Chip SHALL show and announce its selected state.

#### Scenario: Color dot with a label

- **WHEN** a Chip has the dot `mood-2` and the label "Low"
- **THEN** the dot and "Low" are both visible, and a screen reader reads "Low"

#### Scenario: Selecting a filter chip

- **WHEN** an unselected selectable Chip is pressed
- **THEN** its change callback receives `true`, and once selected, a screen reader announces it as selected

### Requirement: BottomSheet

BottomSheet SHALL open a modal sheet from the bottom with the `surface` fill, a handle, an optional title, and a `scrim` backdrop. It SHALL size to its content and close on backdrop tap, on swipe down, and on the Android back button, reporting each close to its owner.

#### Scenario: Open and close

- **WHEN** a BottomSheet is opened and the user taps the backdrop
- **THEN** the sheet closes, and its close callback is called once

#### Scenario: Android back button

- **WHEN** a BottomSheet is open and the user presses the Android back button
- **THEN** the sheet closes instead of the screen

#### Scenario: Title

- **WHEN** a BottomSheet with the title "Edit entry" opens
- **THEN** "Edit entry" is shown at the top and is announced as a header

### Requirement: Dialog

Dialog SHALL show a centered modal with a title, an optional message, a confirm action, and a cancel action over a `scrim` backdrop. The confirm callback SHALL be allowed to return a promise; while it is pending, the Dialog SHALL show loading and SHALL NOT close.

#### Scenario: Confirm

- **WHEN** the user presses the confirm action
- **THEN** the confirm callback is called once

#### Scenario: Cancel paths

- **WHEN** the user presses cancel, taps the backdrop, or presses the Android back button
- **THEN** the cancel callback is called and the confirm callback is not

#### Scenario: Asynchronous confirm

- **WHEN** the confirm callback returns a promise that is still pending
- **THEN** the confirm action shows loading, and cancel, backdrop, and back do not close the Dialog until it settles

#### Scenario: Screen reader focus

- **WHEN** a Dialog opens
- **THEN** a screen reader announces its title, and content behind it cannot be focused

### Requirement: Toast

The app SHALL provide a way to show a short toast message from any screen, with an optional action. A toast SHALL hide by itself after a few seconds, SHALL be announced to screen readers, and SHALL NOT cover the status bar. When toasts are shown in quick succession, they SHALL appear one at a time in order.

#### Scenario: Show and auto-hide

- **WHEN** code shows the toast "Entry saved"
- **THEN** "Entry saved" appears, is announced by a screen reader, and disappears after about 4 seconds

#### Scenario: Action

- **WHEN** a toast with the action "Undo" is shown and the user presses "Undo"
- **THEN** the action callback is called, and the toast hides

#### Scenario: Several toasts

- **WHEN** code shows two toasts one right after the other
- **THEN** the second appears after the first hides

### Requirement: EmptyState

EmptyState SHALL show an icon, a title, an optional message, and an optional action button, centered in its space.

#### Scenario: With an action

- **WHEN** an EmptyState has the title "No entries yet" and the action "Record your first entry"
- **THEN** both are visible, and pressing the action calls its callback

### Requirement: ErrorState

ErrorState SHALL show an icon, a title (default "Something went wrong"), an optional message, and a retry action (default "Try again"). While a retry runs, the action SHALL show loading. The error SHALL be announced to screen readers.

#### Scenario: Retry

- **WHEN** the user presses "Try again"
- **THEN** the retry callback is called once

#### Scenario: Retrying

- **WHEN** ErrorState is in the retrying state
- **THEN** the retry action shows loading and ignores presses

### Requirement: Banner

Banner SHALL show an inline, full-width message with an icon, in a neutral or accent tone, with an optional action and an optional dismiss button. Its message SHALL be announced to screen readers when it appears.

#### Scenario: Offline banner

- **WHEN** a Banner with the message "You're offline" appears
- **THEN** the message and its icon are visible, and a screen reader announces it

#### Scenario: Dismiss

- **WHEN** a dismissible Banner's close button is pressed
- **THEN** the dismiss callback is called, and the close button's label is "Dismiss"

### Requirement: Skeleton

Skeleton SHALL show a placeholder block with a given size and shape (text line, card, or pill) that pulses gently while content loads. Skeletons SHALL be hidden from screen readers.

#### Scenario: Loading placeholder

- **WHEN** a Skeleton with the card shape is rendered
- **THEN** it shows a block with a 22pt radius that pulses

#### Scenario: Screen reader

- **WHEN** a screen reader moves through a screen with Skeletons
- **THEN** it skips the Skeletons

### Requirement: SectionHeader

SectionHeader SHALL show a section title, announced as a header, with an optional trailing action. It SHALL have an opaque `background` fill, so it stays readable when used as a sticky list header.

#### Scenario: With an action

- **WHEN** a SectionHeader has the title "Recent" and the action "See all"
- **THEN** both are visible, and pressing "See all" calls its callback

#### Scenario: Sticky header

- **WHEN** a SectionHeader is used as a sticky header over scrolling content
- **THEN** the content scrolls behind it without showing through

### Requirement: Icon

Icon SHALL render a Lucide icon at a given size, with its color taken from a semantic token (default `foreground`). Icons SHALL be hidden from screen readers unless they are given an accessibility label.

#### Scenario: Token color

- **WHEN** an Icon with the `muted` tone is rendered in light mode
- **THEN** its color is the light `muted` token

#### Scenario: Decorative icon

- **WHEN** an Icon without an accessibility label is rendered
- **THEN** a screen reader does not focus it

#### Scenario: Labeled icon

- **WHEN** an Icon has the accessibility label "Offline"
- **THEN** a screen reader announces "Offline, image"
