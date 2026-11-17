import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import type { ReactNode } from 'react';

import { ToastProvider } from './Toast';

/**
 * The providers the base components need: bottom sheets and toasts. Mount it once in
 * app/_layout.tsx, inside ThemeProvider, so sheets and toasts inherit the theme.
 */
export function UiProvider({ children }: { children: ReactNode }) {
  return (
    <BottomSheetModalProvider>
      <ToastProvider>{children}</ToastProvider>
    </BottomSheetModalProvider>
  );
}
