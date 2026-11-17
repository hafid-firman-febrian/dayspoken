// Global Jest setup: mocks for native-only libraries. Each mock is the smallest thing that
// lets the library be imported; add to it only when a test needs more.

// react-native-nitro-modules loads a native TurboModule as soon as it is imported, and there
// is no native binary in Jest. react-native-mmkv ships its own in-memory mock for
// createMMKV() under Jest, and only needs this import not to throw.
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: { createHybridObject: jest.fn() },
}));
