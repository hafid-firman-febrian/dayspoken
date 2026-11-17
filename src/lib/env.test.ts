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

describe('parseEnv: Supabase values', () => {
  const URL_VAR = 'EXPO_PUBLIC_SUPABASE_URL';
  const KEY_VAR = 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY';
  const LOCAL_URL = 'http://10.0.2.2:54421';
  const CLOUD_URL = 'https://abcdefgh.supabase.co';
  const PUBLISHABLE = 'sb_publishable_abc123';

  function messageOf(raw: Record<string, string | undefined>): string {
    try {
      parseEnv(raw);
    } catch (error) {
      return (error as Error).message;
    }
    throw new Error('parseEnv did not throw');
  }

  it('returns both values when both are set', () => {
    expect(parseEnv({ [URL_VAR]: LOCAL_URL, [KEY_VAR]: PUBLISHABLE })).toEqual({
      appEnv: 'development',
      supabase: { url: LOCAL_URL, publishableKey: PUBLISHABLE },
    });
  });

  it('returns no Supabase values, and does not throw, when neither is set', () => {
    const result = parseEnv({ EXPO_PUBLIC_APP_ENV: 'production' });

    expect(result).toEqual({ appEnv: 'production' });
    expect('supabase' in result).toBe(false);
  });

  it('treats empty Supabase variables as not set', () => {
    expect('supabase' in parseEnv({ [URL_VAR]: '', [KEY_VAR]: '' })).toBe(false);
  });

  it('names the key as missing when only the URL is set', () => {
    expect(messageOf({ [URL_VAR]: LOCAL_URL })).toBe(
      `Invalid ${KEY_VAR}: required when ${URL_VAR} is set`,
    );
  });

  it('names the URL as missing when only the key is set', () => {
    expect(messageOf({ [KEY_VAR]: PUBLISHABLE })).toBe(
      `Invalid ${URL_VAR}: required when ${KEY_VAR} is set`,
    );
  });

  it('refuses a secret key, says so, and never repeats it', () => {
    const secret = 'sb_secret_do-not-ship-this';
    const message = messageOf({ [URL_VAR]: CLOUD_URL, [KEY_VAR]: secret });

    expect(message).toContain(KEY_VAR);
    expect(message).toContain('secret key');
    expect(message).not.toContain(secret);
    expect(message).not.toContain('do-not-ship-this');
  });

  it('refuses a legacy anon key, names the prefix, and never repeats it', () => {
    const legacy = 'eyJhbGciOiJIUzI1NiJ9.legacy-payload.signature';
    const message = messageOf({ [URL_VAR]: CLOUD_URL, [KEY_VAR]: legacy });

    expect(message).toContain(KEY_VAR);
    expect(message).toContain('sb_publishable_');
    expect(message).not.toContain(legacy);
    expect(message).not.toContain('legacy-payload');
  });

  it('refuses a value that is not a web address, and names the variable', () => {
    expect(messageOf({ [URL_VAR]: 'not a url', [KEY_VAR]: PUBLISHABLE })).toContain(URL_VAR);
    expect(messageOf({ [URL_VAR]: 'ftp://example.com', [KEY_VAR]: PUBLISHABLE })).toContain(
      URL_VAR,
    );
    expect(messageOf({ [URL_VAR]: 'https://', [KEY_VAR]: PUBLISHABLE })).toContain(URL_VAR);
  });

  it('accepts a plain http address in development, such as the Android emulator host', () => {
    expect(parseEnv({ [URL_VAR]: LOCAL_URL, [KEY_VAR]: PUBLISHABLE }).supabase?.url).toBe(
      LOCAL_URL,
    );
  });

  it('accepts an https address in production', () => {
    const result = parseEnv({
      EXPO_PUBLIC_APP_ENV: 'production',
      [URL_VAR]: CLOUD_URL,
      [KEY_VAR]: PUBLISHABLE,
    });

    expect(result.supabase?.url).toBe(CLOUD_URL);
  });

  it('says production needs https when the address is plain http', () => {
    expect(
      messageOf({
        EXPO_PUBLIC_APP_ENV: 'production',
        [URL_VAR]: LOCAL_URL,
        [KEY_VAR]: PUBLISHABLE,
      }),
    ).toContain('production needs https');
  });
});
