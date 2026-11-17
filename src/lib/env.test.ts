import { parseEnv } from './env';

describe('parseEnv', () => {
  it('returns production when EXPO_PUBLIC_APP_ENV is production', () => {
    expect(parseEnv({ EXPO_PUBLIC_APP_ENV: 'production' })).toEqual({ appEnv: 'production' });
  });

  it('defaults to development when EXPO_PUBLIC_APP_ENV is missing', () => {
    expect(parseEnv({}).appEnv).toBe('development');
  });

  it('treats an empty EXPO_PUBLIC_APP_ENV as missing', () => {
    expect(parseEnv({ EXPO_PUBLIC_APP_ENV: '' }).appEnv).toBe('development');
  });

  it('throws an error that names the variable and lists the allowed values', () => {
    expect(() => parseEnv({ EXPO_PUBLIC_APP_ENV: 'staging' })).toThrow(
      'Invalid EXPO_PUBLIC_APP_ENV: expected one of development, production (received "staging")',
    );
  });

  it('does not pass through variables it does not know', () => {
    const result = parseEnv({ EXPO_PUBLIC_APP_ENV: 'production', SECRET_KEY: 'do-not-leak' });

    expect(Object.keys(result)).toEqual(['appEnv']);
  });
});
