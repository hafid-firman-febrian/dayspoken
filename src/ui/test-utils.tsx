import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeScope, type ColorScheme } from '@/theme';

// Test helper for base UI components. Not exported from src/ui/index.ts.
// It renders the component the way the app does: inside a theme, with the scheme forced so a
// test can run the same case in light and dark mode. Providers that later components need
// (toasts, bottom sheets) are added here when those components arrive.

/** A phone with a notch and a gesture bar, so safe-area behavior can be asserted. */
export const TEST_SAFE_AREA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

type Options = {
  scheme?: ColorScheme;
} & Omit<RenderOptions, 'wrapper'>;

export function renderWithProviders(
  ui: ReactElement,
  { scheme = 'light', ...options }: Options = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
        <ThemeScope scheme={scheme}>{children}</ThemeScope>
      </SafeAreaProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}

/** For `describe.each`: run the same cases in both modes. */
export const SCHEMES: readonly ColorScheme[] = ['light', 'dark'];
