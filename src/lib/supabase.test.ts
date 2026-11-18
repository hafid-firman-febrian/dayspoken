import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { parseEnv, type SupabaseEnv } from './env';
import type { SessionStorage } from './session-storage';
import {
  createSupabaseClient,
  createSupabaseGetter,
  getSupabase,
  startSessionRefresh,
  watchAppStateForRefresh,
  type AppSupabaseClient,
} from './supabase';

jest.mock('@supabase/supabase-js', () => ({
  // A new object per call, so "same client" assertions mean something.
  createClient: jest.fn(() => ({
    auth: { startAutoRefresh: jest.fn(), stopAutoRefresh: jest.fn() },
  })),
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

  it('saves the session and refreshes it, but never reads a session from a URL', () => {
    const storage: SessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    createSupabaseClient(CONFIG, storage);

    expect(createClientMock.mock.calls[0][2]).toEqual({
      auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  });

  it('uses the encrypted session storage by default', () => {
    createSupabaseClient(CONFIG);

    const auth = createClientMock.mock.calls[0][2]?.auth;
    expect(auth?.storage).toEqual(
      expect.objectContaining({
        getItem: expect.any(Function),
        setItem: expect.any(Function),
        removeItem: expect.any(Function),
      }),
    );
    expect(auth?.persistSession).toBe(true);
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

describe('watchAppStateForRefresh', () => {
  type StateListener = (state: string) => void;
  let listener: StateListener | undefined;
  const remove = jest.fn();
  const client = {
    auth: { startAutoRefresh: jest.fn(), stopAutoRefresh: jest.fn() },
  };

  beforeEach(() => {
    listener = undefined;
    remove.mockClear();
    client.auth.startAutoRefresh.mockClear();
    client.auth.stopAutoRefresh.mockClear();
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _type: string,
      handler: StateListener,
    ) => {
      listener = handler;
      return { remove };
    }) as unknown as typeof AppState.addEventListener);
  });

  afterEach(() => jest.restoreAllMocks());

  // Under Jest React Native mocks currentState as a function, so it is replaced outright.
  const setAppState = (state: string) =>
    Object.defineProperty(AppState, 'currentState', {
      value: state,
      configurable: true,
      writable: true,
    });

  const watch = () => watchAppStateForRefresh(client as unknown as AppSupabaseClient);

  it('starts refreshing when the app is already in the foreground', () => {
    setAppState('active');
    watch();

    expect(client.auth.startAutoRefresh).toHaveBeenCalledTimes(1);
    expect(client.auth.stopAutoRefresh).not.toHaveBeenCalled();
  });

  it('stops refreshing when the app goes to the background, and starts again on return', () => {
    setAppState('active');
    watch();
    client.auth.startAutoRefresh.mockClear();

    listener?.('background');
    expect(client.auth.stopAutoRefresh).toHaveBeenCalledTimes(1);

    listener?.('active');
    expect(client.auth.startAutoRefresh).toHaveBeenCalledTimes(1);
  });

  it('stops refreshing and stops listening when it is cleaned up', () => {
    setAppState('active');
    const stop = watch();
    client.auth.stopAutoRefresh.mockClear();

    stop();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(client.auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
  });
});

describe('startSessionRefresh', () => {
  it('does nothing, and does not throw, when Supabase is not configured', () => {
    const addListener = jest.spyOn(AppState, 'addEventListener');
    addListener.mockClear(); // drop calls recorded by the tests above

    expect(() => startSessionRefresh()()).not.toThrow();
    expect(addListener).not.toHaveBeenCalled();
    addListener.mockRestore();
  });

  describe('when Supabase is configured', () => {
    const load = () => {
      let loaded!: typeof import('./supabase');
      jest.isolateModules(() => {
        jest.doMock('./env', () => ({ env: { appEnv: 'development', supabase: CONFIG } }));
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules needs a synchronous require
        loaded = require('./supabase');
      });
      return loaded;
    };

    afterEach(() => {
      jest.dontMock('./env');
    });

    it('registers one listener however many times it is called', () => {
      const { startSessionRefresh: start } = load();
      const addListener = jest.spyOn(AppState, 'addEventListener');
      addListener.mockClear();
      addListener.mockReturnValue({ remove: jest.fn() });

      const stopFirst = start();
      start();
      expect(addListener).toHaveBeenCalledTimes(1);

      stopFirst();
      start();
      expect(addListener).toHaveBeenCalledTimes(2);
      addListener.mockRestore();
    });
  });
});
