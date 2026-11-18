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

// expo-secure-store is native (Keychain / Keystore). This in-memory version has the same
// synchronous getItem/setItem the session storage uses. Its store is shared by a test file,
// so a test that cares clears it with `__reset()`.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => store.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    __reset: () => store.clear(),
  };
});

// expo-crypto is native. Tests only need random bytes, which Node can give.
jest.mock('expo-crypto', () => {
  const { randomBytes } = jest.requireActual('node:crypto') as {
    randomBytes: (count: number) => Uint8Array;
  };
  return {
    getRandomBytes: jest.fn((count: number) => new Uint8Array(randomBytes(count))),
  };
});
