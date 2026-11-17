import { ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { colorScheme as nativewindColorScheme } from 'nativewind';
import { useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { navigationTheme } from './navigation-theme';
import { resolveScheme } from './resolve-scheme';
import { ThemeScope } from './ThemeScope';
import { useThemeMode } from './theme-mode-store';
import { colors } from './tokens';

type Props = {
  children: ReactNode;
};

/**
 * Chooses the scheme (theme mode + device appearance) and applies it everywhere: class
 * names and code (ThemeScope), the status bar, the native root background, navigators, and
 * the native appearance (keyboard, system dialogs). Mount it once, near the root.
 */
export function ThemeProvider({ children }: Props) {
  const { mode } = useThemeMode();
  const device = useColorScheme();
  const scheme = resolveScheme(mode, device);

  // Keep the native appearance in line with the chosen mode. `system` clears the override.
  useEffect(() => {
    nativewindColorScheme.set(mode);
  }, [mode]);

  // The native root view shows through during transitions and behind the keyboard.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors[scheme].background).catch(() => {
      // A failed native call must not break rendering. The JS background still applies.
    });
  }, [scheme]);

  const navTheme = useMemo(() => navigationTheme(scheme), [scheme]);

  return (
    <NavigationThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ThemeScope scheme={scheme}>{children}</ThemeScope>
    </NavigationThemeProvider>
  );
}
