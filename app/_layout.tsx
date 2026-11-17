import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider } from '@/theme';

import '../src/theme/global.css';

// Provider order (STRUCTURE.md): gestures, then theme, then the navigator. Fonts, the bottom
// sheet, and toasts are added by the steps that introduce them.
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
