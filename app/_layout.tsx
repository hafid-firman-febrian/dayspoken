import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useAppFonts } from '@/theme';
import { UiProvider } from '@/ui';

import '../src/theme/global.css';

// Provider order (STRUCTURE.md): gestures, theme, the UI providers (bottom sheet and toasts),
// then the navigator. The splash screen stays up until Geist is loaded.
export default function RootLayout() {
  const fontsReady = useAppFonts();
  if (!fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <UiProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </UiProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
