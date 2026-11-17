import { vars } from 'nativewind';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cssVariables } from './css-variables';
import { ThemeContext } from './theme-context';
import { colors, type ColorScheme } from './tokens';

type Props = {
  scheme: ColorScheme;
  children: ReactNode;
};

/**
 * Renders its subtree in one scheme, whatever the app's theme mode is. Class names (via CSS
 * variables) and values read with useTheme() both follow it. Used by screens that are
 * always dark, such as Record. It fills its parent (`flex: 1`).
 */
export function ThemeScope({ scheme, children }: Props) {
  return (
    <ThemeContext.Provider value={{ scheme, colors: colors[scheme] }}>
      <View style={[{ flex: 1 }, vars(cssVariables(scheme))]}>{children}</View>
    </ThemeContext.Provider>
  );
}
