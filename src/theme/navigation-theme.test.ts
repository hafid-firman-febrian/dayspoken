import { DarkTheme, DefaultTheme } from 'expo-router';

import { navigationTheme } from './navigation-theme';
import { colors } from './tokens';

describe('navigationTheme', () => {
  it.each(['light', 'dark'] as const)('maps the %s tokens onto the navigation colors', (scheme) => {
    const theme = navigationTheme(scheme);
    expect(theme.colors).toEqual({
      primary: colors[scheme].accent,
      background: colors[scheme].background,
      card: colors[scheme].surface,
      text: colors[scheme].foreground,
      border: colors[scheme].border,
      notification: colors[scheme].accent,
    });
  });

  it('flags the dark theme as dark', () => {
    expect(navigationTheme('dark').dark).toBe(true);
    expect(navigationTheme('light').dark).toBe(false);
  });

  it('keeps the fonts of the navigation defaults', () => {
    expect(navigationTheme('light').fonts).toBe(DefaultTheme.fonts);
    expect(navigationTheme('dark').fonts).toBe(DarkTheme.fonts);
  });
});
