import { kvStorage } from './mmkv';

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
