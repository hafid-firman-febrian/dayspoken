import { createClient } from '@supabase/supabase-js';

import { parseEnv, type SupabaseEnv } from './env';
import { createSupabaseClient, createSupabaseGetter, getSupabase } from './supabase';

jest.mock('@supabase/supabase-js', () => ({
  // A new object per call, so "same client" assertions mean something.
  createClient: jest.fn(() => ({})),
}));

const createClientMock = jest.mocked(createClient);

const CONFIG: SupabaseEnv = {
  url: 'http://10.0.2.2:54421',
  publishableKey: 'sb_publishable_abc123',
};

beforeEach(() => {
  createClientMock.mockClear();
});

describe('createSupabaseClient', () => {
  it('builds the client from the URL and the publishable key', () => {
    createSupabaseClient(CONFIG);

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock.mock.calls[0][0]).toBe(CONFIG.url);
    expect(createClientMock.mock.calls[0][1]).toBe(CONFIG.publishableKey);
  });

  it('keeps session storage, token refresh, and URL session detection off', () => {
    createSupabaseClient(CONFIG);

    expect(createClientMock.mock.calls[0][2]).toEqual({
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  });

  it('is never reached with a secret key, because the env module refuses it first', () => {
    expect(() =>
      createSupabaseClient(
        parseEnv({
          EXPO_PUBLIC_SUPABASE_URL: 'https://abcdefgh.supabase.co',
          EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_do-not-ship-this',
        }).supabase!,
      ),
    ).toThrow('secret key');
    expect(createClientMock).not.toHaveBeenCalled();
  });
});

describe('createSupabaseGetter', () => {
  it('returns the same client on every call and builds it once', () => {
    const get = createSupabaseGetter(() => CONFIG);

    expect(get()).toBe(get());
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });

  it('builds nothing until the client is asked for', () => {
    const read = jest.fn(() => CONFIG);
    createSupabaseGetter(read);

    expect(read).not.toHaveBeenCalled();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('throws an error that names both variables and .env.example when not configured', () => {
    const get = createSupabaseGetter(() => undefined);

    expect(() => get()).toThrow('EXPO_PUBLIC_SUPABASE_URL');
    expect(() => get()).toThrow('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    expect(() => get()).toThrow('.env.example');
    expect(createClientMock).not.toHaveBeenCalled();
  });
});

describe('getSupabase', () => {
  it('throws the configuration error when the test environment sets no Supabase variable', () => {
    expect(() => getSupabase()).toThrow('EXPO_PUBLIC_SUPABASE_URL');
  });
});
