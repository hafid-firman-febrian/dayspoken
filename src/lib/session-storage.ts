import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { createEncryptedKvStorage, type KvStorage } from './mmkv';

// Where the sign-in session lives on the device (design D1). supabase-js saves its session as
// one JSON string that is often larger than a keystore entry should hold, so the session goes
// into an encrypted MMKV file, and only the 32-character key for that file goes into the
// platform keystore (Keychain on iOS, Keystore-backed on Android). The file and the key are
// never in the same place, and the key is never logged, thrown, or shown.

const KEY_NAME = 'dayspoken.session-key';
const STORE_ID = 'dayspoken-auth';
const KEY_LENGTH = 32; // AES-256 takes a 32-byte key.
// 64 symbols, so `byte & 63` picks each one with equal chance (256 is a multiple of 64).
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
// Written out in full on purpose: building it from ALPHABET reads "9-_" as a range, so a key
// holding a literal "-" would be refused and the session wiped on the next launch.
const KEY_PATTERN = /^[A-Za-z0-9_-]{32}$/;

/** The storage shape supabase-js expects for its session. */
export type SessionStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function generateKey(): string {
  return Array.from(getRandomBytes(KEY_LENGTH), (byte) => ALPHABET[byte & 63]).join('');
}

// Used only when the keystore or the encrypted file cannot be used at all. The session then
// lasts until the app closes and the user signs in again: signed out is the safe failure.
function createMemoryStorage(): SessionStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

function wrap(store: KvStorage): SessionStorage {
  return {
    // A read that fails is the same as nothing saved. The error is dropped on purpose: it
    // could carry stored text.
    getItem: (key) => {
      try {
        return store.getString(key) ?? null;
      } catch {
        return null;
      }
    },
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => {
      store.remove(key);
    },
  };
}

export function createSessionStorage(): SessionStorage {
  try {
    const saved = SecureStore.getItem(KEY_NAME);
    const reusable = saved !== null && KEY_PATTERN.test(saved);
    const key = reusable ? saved : generateKey();
    if (!reusable) {
      SecureStore.setItem(KEY_NAME, key);
    }

    const store = createEncryptedKvStorage(STORE_ID, key);
    if (!reusable) {
      // No key means no way to read an older file (a backup restored on a new device, or a key
      // that was lost). Wipe it so nothing unreadable stays behind: the user signs in again.
      store.clearAll();
    }
    return wrap(store);
  } catch {
    return createMemoryStorage();
  }
}
