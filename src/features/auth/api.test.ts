import { AuthApiError, AuthRetryableFetchError, createClient } from '@supabase/supabase-js';

import type { AppSupabaseClient } from '@/lib/supabase';

import { isValidEmail, normalizeEmail, sendCode, signOut, verifyCode } from './api';
import { OTP_LIFETIME_SECONDS } from './types';

const LIFETIME_MS = OTP_LIFETIME_SECONDS * 1000;

function fakeClient() {
  const auth = {
    signInWithOtp: jest.fn(),
    verifyOtp: jest.fn(),
    signOut: jest.fn(),
  };
  return { auth, client: { auth } as unknown as AppSupabaseClient };
}

describe('email helpers', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Ada@Example.COM ')).toBe('ada@example.com');
  });

  it.each(['ada@example.com', ' Ada@Example.com ', 'a.b+tag@sub.example.org'])(
    'accepts %p',
    (value) => expect(isValidEmail(value)).toBe(true),
  );

  it.each(['', '   ', 'ada', 'ada@', '@example.com', 'ada@example', 'ada example@x.com'])(
    'rejects %p',
    (value) => expect(isValidEmail(value)).toBe(false),
  );
});

describe('sendCode', () => {
  it('asks for a code for the cleaned-up address, creating the account when it is new', async () => {
    const { auth, client } = fakeClient();
    auth.signInWithOtp.mockResolvedValue({ data: {}, error: null });

    const result = await sendCode('  Ada@Example.com ', { client, now: () => 5_000 });

    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'ada@example.com',
      options: { shouldCreateUser: true },
    });
    expect(result).toEqual({ ok: true, email: 'ada@example.com', requestedAt: 5_000 });
  });

  it('takes the request time before the request, not after', async () => {
    const { auth, client } = fakeClient();
    let clock = 1_000;
    auth.signInWithOtp.mockImplementation(async () => {
      clock = 9_000; // the request takes a while
      return { data: {}, error: null };
    });

    const result = await sendCode('ada@example.com', { client, now: () => clock });

    expect(result).toMatchObject({ ok: true, requestedAt: 1_000 });
  });

  it('refuses an invalid address without calling the client', async () => {
    const { auth, client } = fakeClient();

    const result = await sendCode('ada@', { client });

    expect(auth.signInWithOtp).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: { code: 'INVALID_EMAIL', message: 'Enter a valid email address.' },
    });
  });

  it('maps a server error to a stable failure', async () => {
    const { auth, client } = fakeClient();
    auth.signInWithOtp.mockResolvedValue({
      data: {},
      error: new AuthApiError('slow down', 429, 'over_email_send_rate_limit'),
    });

    const result = await sendCode('ada@example.com', { client });

    expect(result).toMatchObject({ ok: false, error: { code: 'RATE_LIMITED' } });
  });

  it('maps a thrown error instead of throwing', async () => {
    const { auth, client } = fakeClient();
    auth.signInWithOtp.mockRejectedValue(new AuthRetryableFetchError('Network request failed', 0));

    const result = await sendCode('ada@example.com', { client });

    expect(result).toMatchObject({ ok: false, error: { code: 'OFFLINE' } });
  });

  it('answers with the generic failure, not a throw, when Supabase is not configured', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await sendCode('ada@example.com');

    expect(result).toMatchObject({ ok: false, error: { code: 'SEND_FAILED' } });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('EXPO_PUBLIC_SUPABASE_URL'));
    warn.mockRestore();
  });
});

describe('verifyCode', () => {
  const session = { access_token: 'token', refresh_token: 'refresh' };

  it('checks the code for the cleaned-up address as an email code', async () => {
    const { auth, client } = fakeClient();
    auth.verifyOtp.mockResolvedValue({ data: { session }, error: null });

    const result = await verifyCode(' Ada@Example.com', '123456', 0, { client });

    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: 'ada@example.com',
      token: '123456',
      type: 'email',
    });
    expect(result).toEqual({ ok: true });
  });

  it('treats an answer with no session as a failure', async () => {
    const { auth, client } = fakeClient();
    auth.verifyOtp.mockResolvedValue({ data: { session: null }, error: null });

    expect(await verifyCode('ada@example.com', '123456', 0, { client })).toMatchObject({
      ok: false,
      error: { code: 'VERIFY_FAILED' },
    });
  });

  it('calls a rejected code wrong inside its lifetime and expired after it', async () => {
    const { auth, client } = fakeClient();
    auth.verifyOtp.mockResolvedValue({
      data: { session: null },
      error: new AuthApiError('Token has expired or is invalid', 403, 'otp_expired'),
    });

    const early = await verifyCode('ada@example.com', '123456', 0, { client, now: () => 1_000 });
    const late = await verifyCode('ada@example.com', '123456', 0, {
      client,
      now: () => LIFETIME_MS + 1,
    });

    expect(early).toMatchObject({ ok: false, error: { code: 'CODE_WRONG' } });
    expect(late).toMatchObject({ ok: false, error: { code: 'CODE_EXPIRED' } });
  });

  it.each(['', '12345', '1234567', 'abcdef', '12 456'])(
    'does not send %p, which cannot be a code',
    async (code) => {
      const { auth, client } = fakeClient();

      const result = await verifyCode('ada@example.com', code, 0, { client });

      expect(auth.verifyOtp).not.toHaveBeenCalled();
      expect(result).toMatchObject({ ok: false, error: { code: 'CODE_WRONG' } });
    },
  );

  it('maps a missing connection and a thrown error instead of throwing', async () => {
    const { auth, client } = fakeClient();
    auth.verifyOtp.mockRejectedValue(new AuthRetryableFetchError('Network request failed', 0));

    expect(await verifyCode('ada@example.com', '123456', 0, { client })).toMatchObject({
      ok: false,
      error: { code: 'OFFLINE' },
    });
  });
});

describe('signOut', () => {
  it('signs out of this device only', async () => {
    const { auth, client } = fakeClient();
    auth.signOut.mockResolvedValue({ error: null });

    await signOut({ client });

    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('does not throw when the client throws', async () => {
    const { auth, client } = fakeClient();
    auth.signOut.mockRejectedValue(new Error('boom'));

    await expect(signOut({ client })).resolves.toBeUndefined();
  });

  // A real client with a network that always fails: the spec says the device is signed out
  // even offline, and that comes from supabase-js, so it is tested here, not assumed.
  it('removes the saved session even when the network fails', async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
      removeItem: (key: string) => void values.delete(key),
    };
    const fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    const client = createClient('http://127.0.0.1:54421', 'sb_publishable_test', {
      auth: {
        storage,
        storageKey: 'test-session',
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { fetch },
    });
    storage.setItem(
      'test-session',
      JSON.stringify({
        access_token: 'a.b.c',
        refresh_token: 'r',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: 'u1',
          aud: 'authenticated',
          app_metadata: {},
          user_metadata: {},
          created_at: '',
        },
      }),
    );
    expect(storage.getItem('test-session')).not.toBeNull();

    await signOut({ client: client as unknown as AppSupabaseClient });

    expect(storage.getItem('test-session')).toBeNull();
  });
});
