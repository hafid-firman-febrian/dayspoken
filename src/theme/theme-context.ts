import { createContext, useContext } from 'react';

import type { ColorScheme, SemanticColors } from './tokens';

export type ThemeValue = {
  scheme: ColorScheme;
  /** The semantic colors of the current scheme, for code that needs raw values (icon colors). */
  colors: SemanticColors;
};

export const ThemeContext = createContext<ThemeValue | null>(null);

/** The scheme and colors of the nearest ThemeProvider or ThemeScope. */
export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (value === null) {
    throw new Error('useTheme must be used inside ThemeProvider (see app/_layout.tsx).');
  }
  return value;
}
