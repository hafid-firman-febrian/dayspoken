// Single source of truth for the design tokens (STRUCTURE.md, Styling and theming).
// Pure data: no React Native imports, so Node can load it from tailwind.config.ts.
// This is the only place hex colors may appear. Palette "Tomato", direction "Mono + Mood".

export type SemanticColors = {
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  primary: string;
  'on-primary': string;
  accent: string;
  /** Record button (FAB) fill. */
  fab: string;
  /** Icon on the record button. */
  'on-fab': string;
  /** Dimmed backdrop behind dialogs and sheets. */
  scrim: string;
};

export type ColorScheme = 'light' | 'dark';

export const colors: Record<ColorScheme, SemanticColors> = {
  light: {
    background: '#F8F6F5',
    surface: '#FFFFFF',
    foreground: '#1A1210',
    muted: '#6E6460',
    border: '#ECE6E3',
    primary: '#CC3F27',
    'on-primary': '#FFFFFF',
    accent: '#CC3F27',
    fab: '#CC3F27',
    'on-fab': '#FFFFFF',
    scrim: 'rgba(26, 18, 16, 0.4)',
  },
  dark: {
    background: '#100A09',
    surface: '#1B1312',
    foreground: '#FBF3F1',
    muted: '#B09E99',
    border: '#2D2120',
    primary: '#CC3F27',
    'on-primary': '#FFFFFF',
    accent: '#FB8A6E',
    fab: '#E8573C',
    'on-fab': '#1A0603',
    scrim: 'rgba(0, 0, 0, 0.6)',
  },
};

/**
 * Mood scale colors. The same in both modes. They are indicators only (dots, rings,
 * fills next to a label): none of them reaches 4.5:1 as text, so never use them as
 * a text color, and always show the label (see mood.ts).
 */
export const moodColors = {
  'mood-1': '#6366F1',
  'mood-2': '#0EA5E9',
  'mood-3': '#A8A29E',
  'mood-4': '#10B981',
  'mood-5': '#FBBF24',
} as const;

export type MoodColorToken = keyof typeof moodColors;

/** Record screen palette. Always dark: it does not change with the mode. */
export const recordPalette = {
  background: '#100A09',
  /** VoiceOrb gradient stops, from the lit core to the dark rim. */
  orbStops: ['#FFFFFF', '#FDC8B8', '#E8664C', '#7A2213'],
  finish: '#E8573C',
  finishIcon: '#FFFFFF',
  progress: '#FB8A6E',
} as const;

/** One font family per weight: React Native needs a separate family for each custom weight. */
export const fontFamily = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
} as const;

export type TypeStyle =
  'display' | 'title' | 'heading' | 'body' | 'reading' | 'caption' | 'caption-sm';

type TypeSpec = {
  fontFamily: (typeof fontFamily)[keyof typeof fontFamily];
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  /** Cap for system font scaling. Undefined means the text scales fully. */
  maxFontSizeMultiplier?: number;
};

export const typography: Record<TypeStyle, TypeSpec> = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1,
    maxFontSizeMultiplier: 1.4,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 27,
    lineHeight: 32,
    letterSpacing: -0.5,
    maxFontSizeMultiplier: 1.4,
  },
  heading: { fontFamily: fontFamily.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  // 17 * 1.6 = 27.2, rounded to 27.
  reading: { fontFamily: fontFamily.regular, fontSize: 17, lineHeight: 27, letterSpacing: 0 },
  caption: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
  'caption-sm': { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
};

/** Cards and hero cards. Buttons and chips are pills (`rounded-full`). */
export const radius = {
  card: 22,
  hero: 30,
} as const;

/** The scale is Tailwind's 4pt grid (p-1 = 4). Only the screen gutter is named here. */
export const spacing = {
  gutter: 20,
} as const;
