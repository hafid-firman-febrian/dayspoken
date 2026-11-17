import { DarkTheme, DefaultTheme } from 'expo-router';

import { colors, type ColorScheme } from './tokens';

type NavigationTheme = typeof DefaultTheme;

// Navigators paint their own backgrounds (screen container, headers, cards). Without this
// theme they show React Navigation's default grays, which would flash in dark mode.
export function navigationTheme(scheme: ColorScheme): NavigationTheme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const c = colors[scheme];
  return {
    ...base,
    dark: scheme === 'dark',
    colors: {
      primary: c.accent,
      background: c.background,
      card: c.surface,
      text: c.foreground,
      border: c.border,
      notification: c.accent,
    },
  };
}
