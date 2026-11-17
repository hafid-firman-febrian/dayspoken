# Spec Delta

## Purpose

Defines how Dayspoken chooses between light and dark: it follows the system by default, accepts a persisted manual override, applies the result to every surface, and lets a screen such as Record stay dark regardless of the choice.

## ADDED Requirements

### Requirement: Theme mode preference

The app SHALL offer three theme modes: `system`, `light`, and `dark`. The default SHALL be `system`.

#### Scenario: First launch

- **WHEN** the app starts for the first time
- **THEN** the theme mode is `system`

#### Scenario: Choosing a mode

- **WHEN** code sets the theme mode to `dark`
- **THEN** the app renders in dark mode, whatever the system appearance is

### Requirement: System mode follows the device

In `system` mode, the app SHALL render in the device's current appearance and SHALL switch when the device appearance changes while the app is open, without a restart.

#### Scenario: Device in dark appearance

- **WHEN** the theme mode is `system` and the device appearance is dark
- **THEN** the app renders in dark mode

#### Scenario: Device appearance changes while the app is open

- **WHEN** the theme mode is `system` and the device appearance changes from light to dark
- **THEN** the app switches to dark mode without a restart

#### Scenario: Manual mode ignores the device

- **WHEN** the theme mode is `light` and the device appearance changes to dark
- **THEN** the app stays in light mode

### Requirement: The preference survives restarts

The chosen theme mode SHALL be stored on the device and restored before the first screen renders. A missing or unreadable stored value SHALL fall back to `system`.

#### Scenario: Restart after choosing dark

- **WHEN** the user's theme mode is `dark` and the app is closed and opened again
- **THEN** the first screen renders in dark mode, with no light frame before it

#### Scenario: Unknown stored value

- **WHEN** the stored theme mode is a value other than `system`, `light`, or `dark`
- **THEN** the app uses `system`

#### Scenario: Back to system

- **WHEN** the theme mode is changed from `dark` back to `system` and the app restarts
- **THEN** the app follows the device appearance again

### Requirement: The mode reaches every surface

The resolved mode SHALL apply to every screen and overlay (bottom sheets, dialogs, toasts), the status bar, navigation backgrounds, and the native root background, so no surface shows the other mode's colors.

#### Scenario: Overlays follow the mode

- **WHEN** the app is in dark mode and a bottom sheet, a dialog, or a toast opens
- **THEN** it uses the dark token values

#### Scenario: Status bar

- **WHEN** the app is in dark mode
- **THEN** the status bar shows light content, and in light mode it shows dark content

#### Scenario: No light flash in dark mode

- **WHEN** the app is in dark mode and navigates between screens or opens the keyboard
- **THEN** no white or light background shows behind the content

### Requirement: Forced dark subtree

A screen SHALL be able to render its subtree in dark mode regardless of the app's theme mode. Everything inside that subtree, including components that read token values in code, SHALL use the dark values. The rest of the app SHALL keep its mode.

#### Scenario: Forced dark in light mode

- **WHEN** the app is in light mode and a screen wraps its content in a forced dark scope
- **THEN** that content uses the dark token values, and screens outside the scope stay light

#### Scenario: Token values read in code

- **WHEN** a component inside a forced dark scope reads the current token values in code, for example an icon color
- **THEN** it receives the dark values
