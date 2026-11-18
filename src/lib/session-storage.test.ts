import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { createSessionStorage } from './session-storage';

// The MMKV Jest mock keeps each instance apart, but the real MMKV shares one file per id and
// cannot read it with another key. This fake behaves like the real one, so the "restart" and
// "key lost" cases mean something. `files` shows what is left on disk.
const mockFiles = new Map<string, { key: string; values: Map<string, string> }>();
jest.mock('./mmkv', () => ({
  createEncryptedKvStorage: (id: string, key: string) => {
    if (!mockFiles.has(id)) {
      mockFiles.set(id, { key, values: new Map() });
    }
    const readable = () => mockFiles.get(id)?.key === key;
    return {
      getString: (name: string) => (readable() ? mockFiles.get(id)?.values.get(name) : undefined),
      set: (name: string, value: string) => {
        // A write with a different key replaces the file, as MMKV does when it cannot decrypt.
        if (!readable()) {
          mockFiles.set(id, { key, values: new Map() });
        }
        mockFiles.get(id)?.values.set(name, value);
      },
      remove: (name: string) => mockFiles.get(id)?.values.delete(name) ?? false,
      clearAll: () => mockFiles.get(id)?.values.clear(),
    };
  },
}));

const secureStore = SecureStore as unknown as { __reset: () => void };
const KEY_NAME = 'dayspoken.session-key';
const SESSION_JSON = JSON.stringify({ access_token: 'access-token-value-123', user: { id: 'u1' } });

beforeEach(() => {
  mockFiles.clear();
  secureStore.__reset();
  jest.clearAllMocks();
});

describe('createSessionStorage', () => {
  it('creates a 32-character key in the secure store on first use, and reuses it after', () => {
    createSessionStorage();
    const key = SecureStore.getItem(KEY_NAME);
    expect(key).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(SecureStore.setItem).toHaveBeenCalledTimes(1);

    createSessionStorage();
    expect(SecureStore.getItem(KEY_NAME)).toBe(key);
    expect(SecureStore.setItem).toHaveBeenCalledTimes(1);
  });

  it('reuses a key that holds every symbol, including - and _', () => {
    // Bytes 62 and 63 become "-" and "_" (the last two symbols of the alphabet).
    const bytes = Uint8Array.from({ length: 32 }, (_, index) => 62 + (index % 2));
    jest.mocked(getRandomBytes).mockReturnValueOnce(bytes);

    createSessionStorage().setItem('sb-session', SESSION_JSON);
    expect(SecureStore.getItem(KEY_NAME)).toBe('-_'.repeat(16));
    expect(createSessionStorage().getItem('sb-session')).toBe(SESSION_JSON);
  });

  it('draws the key from the random source, not from a fixed value', () => {
    createSessionStorage();
    expect(getRandomBytes).toHaveBeenCalledWith(32);
  });

  it('stores a value and reads it back', () => {
    const storage = createSessionStorage();
    storage.setItem('sb-session', SESSION_JSON);
    expect(storage.getItem('sb-session')).toBe(SESSION_JSON);
  });

  it('returns null for a key that was never saved', () => {
    expect(createSessionStorage().getItem('sb-session')).toBeNull();
  });

  it('removes a value', () => {
    const storage = createSessionStorage();
    storage.setItem('sb-session', SESSION_JSON);
    storage.removeItem('sb-session');
    expect(storage.getItem('sb-session')).toBeNull();
  });

  it('keeps the session across a restart while the key is still in the secure store', () => {
    createSessionStorage().setItem('sb-session', SESSION_JSON);
    expect(createSessionStorage().getItem('sb-session')).toBe(SESSION_JSON);
  });

  it('wipes the old data and starts empty when the key is gone', () => {
    createSessionStorage().setItem('sb-session', SESSION_JSON);
    expect(mockFiles.get('dayspoken-auth')?.values.size).toBe(1);

    secureStore.__reset(); // the keystore lost the key, for example after a restore
    const storage = createSessionStorage();
    expect(storage.getItem('sb-session')).toBeNull();
    // Not just unreadable: the old data is wiped from the file.
    expect(mockFiles.get('dayspoken-auth')?.values.size).toBe(0);
  });

  it('replaces a damaged key with a new one and starts empty', () => {
    createSessionStorage().setItem('sb-session', SESSION_JSON);
    SecureStore.setItem(KEY_NAME, 'not a valid key');
    const storage = createSessionStorage();
    expect(storage.getItem('sb-session')).toBeNull();
    expect(mockFiles.get('dayspoken-auth')?.values.size).toBe(0);
    expect(SecureStore.getItem(KEY_NAME)).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });

  describe('when the secure store fails', () => {
    it('does not throw, and keeps the session in memory only', () => {
      jest.mocked(SecureStore.getItem).mockImplementationOnce(() => {
        throw new Error('keystore unavailable');
      });
      const storage = createSessionStorage();
      storage.setItem('sb-session', SESSION_JSON);
      expect(storage.getItem('sb-session')).toBe(SESSION_JSON);
      expect(createSessionStorage().getItem('sb-session')).toBeNull();
    });
  });

  describe('secrecy', () => {
    it('never writes the key or a stored value to the console', () => {
      const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
        jest.spyOn(console, method).mockImplementation(() => undefined),
      );
      const storage = createSessionStorage();
      storage.setItem('sb-session', SESSION_JSON);
      storage.getItem('sb-session');
      secureStore.__reset();
      createSessionStorage().getItem('sb-session');

      for (const spy of spies) {
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
      }
    });

    it('does not put the key in the secure store under the session key name', () => {
      const storage = createSessionStorage();
      storage.setItem('sb-session', SESSION_JSON);
      // Only the key lives in the secure store, never the session itself.
      expect(SecureStore.getItem('sb-session')).toBeNull();
      expect(SecureStore.getItem(KEY_NAME)).not.toContain('access-token');
    });
  });
});
