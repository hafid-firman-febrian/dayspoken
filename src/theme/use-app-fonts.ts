import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { GEIST_FONTS } from './fonts';

// Hold the splash screen as soon as this module loads, before the first render, so no
// screen can appear in the system font. The fonts are bundled, so this works offline.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already prevented or hidden (for example after a fast refresh): nothing to do.
});

/**
 * Loads Geist and hides the splash screen when it is done. Returns true when the app can
 * render: the fonts loaded, or loading failed (then the app opens in the system font
 * instead of hanging on the splash screen).
 *
 * `hold` keeps the splash screen up even when the fonts are ready, for something else the first
 * screen needs (the root layout holds it until the saved sign-in session has been read). It is
 * off by default, and it only delays hiding: the return value is about the fonts alone.
 */
export function useAppFonts({ hold = false }: { hold?: boolean } = {}): boolean {
  const [loaded, error] = useFonts(GEIST_FONTS);
  const ready = loaded || error !== null;

  useEffect(() => {
    if (ready && !hold) {
      SplashScreen.hideAsync().catch(() => {
        // Already hidden: nothing to do.
      });
    }
  }, [ready, hold]);

  return ready;
}
