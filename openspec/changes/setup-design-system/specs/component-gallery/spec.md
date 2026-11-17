# Spec Delta

## Purpose

Gives developers one screen, available only in development builds, that shows every base component, its states, and the design tokens in light and dark mode, so visual regressions and contrast problems are easy to spot before feature screens use them.

## ADDED Requirements

### Requirement: Gallery shows every base component

The gallery SHALL show every base component (Screen, Text, Button, IconButton, TextField, CodeInput, Card, Chip, BottomSheet, Dialog, Toast, EmptyState, ErrorState, Banner, Skeleton, SectionHeader, Icon), each in its own titled section with its main states, such as disabled, loading, error, and selected.

#### Scenario: Every component has a section

- **WHEN** the gallery renders
- **THEN** it has one section per base component, titled with the component's name

#### Scenario: States are visible

- **WHEN** a developer scrolls to the Button section
- **THEN** it shows the primary, secondary, and ghost variants, the small size, and the disabled and loading states

#### Scenario: Overlays can be opened

- **WHEN** a developer presses the buttons in the BottomSheet, Dialog, and Toast sections
- **THEN** a sheet, a dialog, and a toast open, each showing its content

### Requirement: Gallery shows the tokens

The gallery SHALL show the type scale (one sample per text style), each semantic color token with its name and current value, the mood scale with each level's label next to its color, and the Record palette.

#### Scenario: Mood scale

- **WHEN** a developer views the mood scale section
- **THEN** all five levels are shown, each with its number, label, and color

#### Scenario: Color values follow the mode

- **WHEN** the gallery switches from light to dark mode
- **THEN** each color swatch and its listed value change to the dark token value

### Requirement: Gallery switches between light and dark

The gallery SHALL have a theme switch with the options System, Light, and Dark. The switch SHALL change the app's real theme mode preference. The gallery SHALL also show a sample in a forced dark scope.

#### Scenario: Switching to dark

- **WHEN** a developer selects Dark in the gallery's theme switch
- **THEN** the whole gallery, including opened sheets, dialogs, and toasts, renders in dark mode

#### Scenario: Preference is the real one

- **WHEN** a developer selects Dark in the gallery and restarts the app
- **THEN** the app opens in dark mode

#### Scenario: Forced dark sample

- **WHEN** the gallery is in light mode
- **THEN** its forced dark sample still renders with dark token values

### Requirement: Gallery is available only in development builds

The gallery SHALL be reachable at `/dev/gallery` in development builds, with a link from the placeholder home screen. In production builds the link SHALL NOT appear, and opening `/dev/gallery` SHALL redirect to the home route.

#### Scenario: Development build

- **WHEN** a developer opens the placeholder home screen in a development build
- **THEN** it shows a link to the component gallery, and the link opens `/dev/gallery`

#### Scenario: Production build

- **WHEN** a production build opens the gallery route through a deep link (`dayspoken://dev/gallery`)
- **THEN** the app shows the home route instead of the gallery

#### Scenario: No link in production

- **WHEN** the placeholder home screen renders in a production build
- **THEN** no gallery link is shown
