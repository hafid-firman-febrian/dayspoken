import { createEncryptedKvStorage, kvStorage } from './mmkv';

describe('kvStorage', () => {
  it('returns undefined for a key that was never set', () => {
    expect(kvStorage.getString('test.missing')).toBeUndefined();
  });

  it('stores and reads back a string', () => {
    kvStorage.set('test.greeting', 'hello');
    expect(kvStorage.getString('test.greeting')).toBe('hello');
  });

  it('removes a key', () => {
    kvStorage.set('test.temporary', 'x');
    expect(kvStorage.remove('test.temporary')).toBe(true);
    expect(kvStorage.getString('test.temporary')).toBeUndefined();
  });
});

describe('createEncryptedKvStorage', () => {
  const KEY = '0123456789abcdef0123456789abcdef';

  it('stores and reads back a string', () => {
    const store = createEncryptedKvStorage('test-secure-roundtrip', KEY);
    store.set('session', 'secret value');
    expect(store.getString('session')).toBe('secret value');
  });

  it('returns undefined for a key that was never set', () => {
    const store = createEncryptedKvStorage('test-secure-missing', KEY);
    expect(store.getString('nothing')).toBeUndefined();
  });

  it('removes a key', () => {
    const store = createEncryptedKvStorage('test-secure-remove', KEY);
    store.set('session', 'x');
    expect(store.remove('session')).toBe(true);
    expect(store.getString('session')).toBeUndefined();
  });

  it('keeps its values apart from the plain store', () => {
    const store = createEncryptedKvStorage('test-secure-apart', KEY);
    store.set('test.apart', 'in the encrypted store');
    expect(kvStorage.getString('test.apart')).toBeUndefined();
  });

  it('wipes every key with clearAll', () => {
    const store = createEncryptedKvStorage('test-secure-clear', KEY);
    store.set('a', '1');
    store.set('b', '2');
    store.clearAll();
    expect(store.getString('a')).toBeUndefined();
    expect(store.getString('b')).toBeUndefined();
  });
});
