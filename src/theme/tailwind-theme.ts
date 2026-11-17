import {
  fontFamily,
  moodColors,
  radius,
  recordPalette,
  spacing,
  typography,
  colors,
} from './tokens';

// The Tailwind `theme.extend` object, built only from the token source. Kept apart from
// tailwind.config.ts so it can be unit tested without loading the NativeWind preset.

/** Semantic colors switch with the mode, so each one reads a CSS variable set by ThemeProvider. */
function semanticColors(): Record<string, string> {
  return Object.fromEntries(
    Object.keys(colors.light).map((name) => [
      name,
      // scrim carries its own alpha (it differs per mode), so it is not split into channels.
      name === 'scrim' ? 'var(--color-scrim)' : `rgb(var(--color-${name}) / <alpha-value>)`,
    ]),
  );
}

function fontSizes(): Record<string, [string, { lineHeight: string; letterSpacing: string }]> {
  return Object.fromEntries(
    Object.entries(typography).map(([style, spec]) => [
      style,
      [
        `${spec.fontSize}px`,
        { lineHeight: `${spec.lineHeight}px`, letterSpacing: `${spec.letterSpacing}px` },
      ],
    ]),
  );
}

const themeColors: Record<string, string | Record<string, string>> = {
  ...semanticColors(),
  // Mode-independent colors: used as-is, so they do not need CSS variables.
  ...moodColors,
  record: {
    background: recordPalette.background,
    finish: recordPalette.finish,
    progress: recordPalette.progress,
  },
};

export const tailwindTheme = {
  colors: themeColors,
  fontFamily: {
    geist: [fontFamily.regular],
    'geist-medium': [fontFamily.medium],
    'geist-semibold': [fontFamily.semibold],
    'geist-bold': [fontFamily.bold],
  },
  fontSize: fontSizes(),
  borderRadius: {
    card: `${radius.card}px`,
    hero: `${radius.hero}px`,
  },
  spacing: {
    gutter: `${spacing.gutter}px`,
  },
};
