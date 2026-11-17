# Spec Delta

## Purpose

Defines the Dayspoken visual tokens ("Mono + Mood", palette "Tomato"): the semantic colors per mode, the mood scale, the Record palette, typography, spacing, and radii, so every screen takes its look from one place and meets the contrast rules.

## ADDED Requirements

### Requirement: Semantic color tokens per mode

The app SHALL define these semantic color tokens once for light mode and once for dark mode, in one place: `background`, `surface`, `foreground`, `muted`, `border`, `primary`, `on-primary`, `accent`, `fab`, `on-fab`, and `scrim`. Changing a token value in that place SHALL change it everywhere it is used.

#### Scenario: Light mode values

- **WHEN** the app renders in light mode
- **THEN** the tokens resolve to background `#F8F6F5`, surface `#FFFFFF`, foreground `#1A1210`, muted `#6E6460`, border `#ECE6E3`, primary `#CC3F27`, on-primary `#FFFFFF`, accent `#CC3F27`, fab `#CC3F27`, on-fab `#FFFFFF`, and scrim rgba(26, 18, 16, 0.4)

#### Scenario: Dark mode values

- **WHEN** the app renders in dark mode
- **THEN** the tokens resolve to background `#100A09`, surface `#1B1312`, foreground `#FBF3F1`, muted `#B09E99`, border `#2D2120`, primary `#CC3F27`, on-primary `#FFFFFF`, accent `#FB8A6E`, fab `#E8573C`, on-fab `#1A0603`, and scrim rgba(0, 0, 0, 0.6)

#### Scenario: A token is changed in one place

- **WHEN** a developer changes the light `surface` value in the token source
- **THEN** every component that uses the `surface` token shows the new value in light mode, and no other file needs an edit

### Requirement: Components use tokens, not hex values

Code in `app/` and `src/`, outside the theme folder, SHALL NOT contain hex color literals. A hex color literal there SHALL fail `npm run lint`.

#### Scenario: Hex color in a component

- **WHEN** a file in `app/` or `src/` outside `src/theme/` contains a string such as `'#CC3F27'`
- **THEN** `npm run lint` fails with an error on that line that points to the semantic tokens

#### Scenario: Hex color in the theme folder

- **WHEN** a file in `src/theme/` contains hex color values
- **THEN** `npm run lint` does not report them

#### Scenario: Token class names

- **WHEN** a component uses class names such as `bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `border-border`, `bg-primary`, `text-on-primary`, `text-accent`, `bg-fab`, or `bg-mood-3`
- **THEN** the element gets the color of that token in the current mode

### Requirement: Mood scale

The app SHALL define a mood scale with five levels, each with a fixed label and color that are the same in both modes: 1 Rough `#6366F1`, 2 Low `#0EA5E9`, 3 Okay `#A8A29E`, 4 Good `#10B981`, 5 Great `#FBBF24`.

#### Scenario: Looking up a level

- **WHEN** code asks the mood scale for level 4
- **THEN** it gets the label "Good" and the `mood-4` color token

#### Scenario: Same colors in both modes

- **WHEN** a mood color is rendered in light mode and in dark mode
- **THEN** it has the same value in both

### Requirement: A mood is never shown by color alone

Every element that shows a mood color SHALL also show the mood's label as text. Mood colors SHALL NOT be used as text color.

#### Scenario: Mood shown with a color dot

- **WHEN** a component shows mood level 1 with its color
- **THEN** the label "Rough" is visible next to the color, and a screen reader reads "Rough"

#### Scenario: Label text color

- **WHEN** a mood label is shown
- **THEN** the label uses the `foreground` or `muted` token, not a mood color

### Requirement: Record palette

The app SHALL define the Record palette as tokens that do not change with the mode: background `#100A09`, VoiceOrb gradient stops `#FFFFFF`, `#FDC8B8`, `#E8664C`, `#7A2213` (in that order), Finish button `#E8573C` with a white icon, and progress bar `#FB8A6E`.

#### Scenario: Record tokens in light mode

- **WHEN** the app is in light mode and code reads the Record palette
- **THEN** it gets the same values as in dark mode

#### Scenario: Gradient order

- **WHEN** code reads the VoiceOrb gradient stops
- **THEN** it gets four colors ordered from `#FFFFFF` to `#7A2213`

### Requirement: Text contrast

Every pairing of a text token with the background it is meant for SHALL have a WCAG contrast ratio of at least 4.5:1 in both modes. An automated test SHALL fail when a token change breaks this.

#### Scenario: Text pairs meet 4.5:1

- **WHEN** the test computes the contrast of `foreground` and `muted` on `background` and `surface`, `accent` on `background` and `surface`, and `on-primary` on `primary`, in light and in dark mode
- **THEN** every ratio is at least 4.5:1

#### Scenario: A token change breaks contrast

- **WHEN** a developer changes the light `muted` value to `#A8A29E`
- **THEN** `npm test` fails and names the failing pair and its ratio

### Requirement: Icon contrast on filled buttons

Icons on filled buttons SHALL have a contrast ratio of at least 3:1 with their fill, in both modes. An automated test SHALL check these pairs.

#### Scenario: Icon pairs meet 3:1

- **WHEN** the test computes the contrast of `on-fab` on `fab`, `on-primary` on `primary`, `primary` on `on-primary` (the white mic button), and the Finish icon on the Finish button
- **THEN** every ratio is at least 3:1

### Requirement: Geist typography

All app text SHALL use the Geist font, in these styles: display 38/700 with tight letter spacing, title 27/600, heading 18/600, body 16/400, reading 17/400 with a 1.6 line height, caption 13/500, and small caption 12/500. A screen SHALL NOT show text in another font.

#### Scenario: Styles

- **WHEN** a text element uses the display style
- **THEN** it renders in Geist Bold at size 38 with negative letter spacing

#### Scenario: Reading style

- **WHEN** a text element uses the reading style
- **THEN** it renders in Geist Regular at size 17 with a line height of about 27 (1.6)

### Requirement: Fonts are ready before the first screen

The app SHALL keep the splash screen visible until the Geist fonts are loaded, so no screen renders first in the system font. The fonts SHALL ship inside the app and SHALL NOT be downloaded at runtime. If loading fails, the app SHALL still open.

#### Scenario: Cold start

- **WHEN** the app starts
- **THEN** the splash screen stays until the fonts are loaded, and the first screen renders in Geist

#### Scenario: Offline cold start

- **WHEN** the app starts with no network connection
- **THEN** the fonts load and the first screen renders in Geist

#### Scenario: Font loading fails

- **WHEN** loading the fonts fails
- **THEN** the splash screen hides and the app opens with the system font instead of hanging

### Requirement: Spacing and radii

Spacing SHALL follow a 4pt grid, with a 20pt horizontal screen gutter. Cards SHALL use a 22pt radius, hero cards a 30pt radius, and buttons and chips a pill shape.

#### Scenario: Spacing unit

- **WHEN** a component uses spacing step 1 or step 5
- **THEN** it gets 4pt or 20pt

#### Scenario: Screen gutter

- **WHEN** a screen uses the default screen container
- **THEN** its content is inset 20pt from the left and right edges

#### Scenario: Radii

- **WHEN** a card, a hero card, a button, and a chip are rendered
- **THEN** their corner radii are 22pt, 30pt, half their height, and half their height
