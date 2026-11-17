const STORAGE_KEY = 'preferences.theme';

type StoreModule = typeof import('./theme-mode-store');
type MmkvModule = typeof import('@/lib/mmkv');

// Loads the store in a fresh module registry, like an app start. `before` runs first, with
// the storage that this fresh registry will use, so it can pre-fill what an earlier run saved.
function startApp(before?: (kvStorage: MmkvModule['kvStorage']) => void): StoreModule {
  let store!: StoreModule;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    before?.((require('@/lib/mmkv') as MmkvModule).kvStorage);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    store = require('./theme-mode-store') as StoreModule;
  });
  return store;
}

const saved = (mode: unknown) => JSON.stringify({ state: { mode }, version: 1 });

describe('theme mode store', () => {
  it('defaults to system on first launch', () => {
    const { useThemeModeStore } = startApp();
    expect(useThemeModeStore.getState().mode).toBe('system');
  });

  it('changes the mode', () => {
    const { useThemeModeStore } = startApp();
    useThemeModeStore.getState().setMode('dark');
    expect(useThemeModeStore.getState().mode).toBe('dark');
  });

  it('persists the chosen mode in storage', () => {
    let storage!: MmkvModule['kvStorage'];
    const { useThemeModeStore } = startApp((kv) => {
      storage = kv;
    });
    useThemeModeStore.getState().setMode('dark');
    expect(JSON.parse(storage.getString(STORAGE_KEY) ?? 'null').state.mode).toBe('dark');
  });

  it('restores the saved mode synchronously when the app starts', () => {
    const { useThemeModeStore } = startApp((kv) => kv.set(STORAGE_KEY, saved('dark')));
    // No await: the first render must already see the saved mode, with no light frame.
    expect(useThemeModeStore.getState().mode).toBe('dark');
  });

  it('falls back to system for an unknown stored value', () => {
    const { useThemeModeStore } = startApp((kv) => kv.set(STORAGE_KEY, saved('banana')));
    expect(useThemeModeStore.getState().mode).toBe('system');
  });

  it('falls back to system when the stored value is not valid JSON', () => {
    const { useThemeModeStore } = startApp((kv) => kv.set(STORAGE_KEY, '{not json'));
    expect(useThemeModeStore.getState().mode).toBe('system');
  });

  it('returns to system and keeps it after a restart', () => {
    let storage!: MmkvModule['kvStorage'];
    const first = startApp((kv) => {
      storage = kv;
      kv.set(STORAGE_KEY, saved('dark'));
    });
    first.useThemeModeStore.getState().setMode('system');
    expect(JSON.parse(storage.getString(STORAGE_KEY) ?? 'null').state.mode).toBe('system');

    const restarted = startApp((kv) => kv.set(STORAGE_KEY, storage.getString(STORAGE_KEY) ?? ''));
    expect(restarted.useThemeModeStore.getState().mode).toBe('system');
  });
});
