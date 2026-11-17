import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useAppFonts } from '@/theme';

import '../src/theme/global.css';

// Provider order (STRUCTURE.md): gestures, then theme, then the navigator. The splash screen
// stays up until Geist is loaded. The bottom sheet and toasts are added by the steps that
// introduce them.
export default function RootLayout() {
  const fontsReady = useAppFonts();
  if (!fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
