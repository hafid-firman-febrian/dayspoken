import { createMMKV } from 'react-native-mmkv';

// The only file that imports react-native-mmkv (lint enforces it). Everything else uses
// this small adapter, so the storage library can change without touching callers.
// MMKV is synchronous, so a stored preference is available before the first render.

const mmkv = createMMKV({ id: 'dayspoken' });

export type KvStorage = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  remove: (key: string) => boolean;
};

export const kvStorage: KvStorage = {
  getString: (key: string): string | undefined => mmkv.getString(key),
  set: (key: string, value: string): void => mmkv.set(key, value),
  remove: (key: string): boolean => mmkv.remove(key),
};

// A separate store whose file is encrypted with AES-256. `key` must be 32 bytes long (32
// characters); where it is kept is the caller's business (the session storage keeps it in the
// platform keystore). Same shape as kvStorage, plus `clearAll` so a caller can wipe a store it
// can no longer read.
export function createEncryptedKvStorage(
  id: string,
  key: string,
): KvStorage & { clearAll: () => void } {
  const store = createMMKV({ id, encryptionKey: key, encryptionType: 'AES-256' });
  return {
    getString: (name) => store.getString(name),
    set: (name, value) => store.set(name, value),
    remove: (name) => store.remove(name),
    clearAll: () => store.clearAll(),
  };
}
