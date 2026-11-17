import { createMMKV } from 'react-native-mmkv';

// The only file that imports react-native-mmkv (lint enforces it). Everything else uses
// this small adapter, so the storage library can change without touching callers.
// MMKV is synchronous, so a stored preference is available before the first render.

const mmkv = createMMKV({ id: 'dayspoken' });

export const kvStorage = {
  getString: (key: string): string | undefined => mmkv.getString(key),
  set: (key: string, value: string): void => mmkv.set(key, value),
  remove: (key: string): boolean => mmkv.remove(key),
};
