// Global Jest setup: mocks for native-only libraries. Each mock is the smallest thing that
// lets the library be imported; add to it only when a test needs more.

// Gesture Handler ships its own Jest setup (it mocks the native module and its components).
import 'react-native-gesture-handler/jestSetup';

// Reanimated ships a Jest mock: animations resolve at once and worklets run on the JS thread.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Fonts and the splash screen are native. Importing the theme barrel ('@/theme') loads
// them, so they are mocked for every test: fonts report as loaded, the splash is a no-op.
// A test that cares (use-app-fonts.test.tsx) overrides these with its own jest.mock.
jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true, null]),
}));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// The bottom-sheet library ships a Jest mock: sheets present and dismiss without native gestures.
jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

// react-native-nitro-modules loads a native TurboModule as soon as it is imported, and there
// is no native binary in Jest. react-native-mmkv ships its own in-memory mock for
// createMMKV() under Jest, and only needs this import not to throw.
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: { createHybridObject: jest.fn() },
}));
