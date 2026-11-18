import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useSession } from '@/features/auth';
import { startSessionRefresh } from '@/lib/supabase';
import { ThemeProvider, useAppFonts } from '@/theme';
import { UiProvider } from '@/ui';

import '../src/theme/global.css';

// Provider order (STRUCTURE.md), outermost first: auth state, the font and session gate, gestures,
// theme, the UI providers (bottom sheet and toasts), then the navigator. Auth sits outside the
// gate because the gate needs to know when the saved session has been read. It needs no theme or
// fonts, and the screens below still reach it.
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { status } = useSession();
  // The splash screen stays up until Geist is loaded AND the saved session has been read, so a
  // returning user never sees a frame of the Welcome screen.
  const fontsReady = useAppFonts({ hold: status === 'loading' });

  // Refresh the session while the app is in the foreground (a no-op with no backend configured).
  useEffect(() => startSessionRefresh(), []);

  if (!fontsReady || status === 'loading') {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <UiProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={status === 'signed-out'}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
            <Stack.Protected guard={status === 'signed-in'}>
              <Stack.Screen name="index" />
            </Stack.Protected>
            {/* Development tool: reachable signed in or out. It redirects home in production. */}
            <Stack.Screen name="dev/gallery" />
          </Stack>
        </UiProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
