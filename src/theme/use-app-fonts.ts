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
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(GEIST_FONTS);
  const ready = loaded || error !== null;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {
        // Already hidden: nothing to do.
      });
    }
  }, [ready]);

  return ready;
}
