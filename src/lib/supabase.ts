// React Native's built-in URL is incomplete and supabase-js needs the full one.
import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import type { Database } from '../../supabase/functions/_shared/database.types';
import { env, type SupabaseEnv } from './env';
import { createSessionStorage, type SessionStorage } from './session-storage';

// The app talks to Supabase only with the publishable key, so it only reaches what row-level
// security allows. Secret keys live in Supabase, never here (env.ts refuses them).
export type AppSupabaseClient = SupabaseClient<Database>;

export function createSupabaseClient(
  config: SupabaseEnv,
  storage: SessionStorage = createSessionStorage(),
): AppSupabaseClient {
  return createClient<Database>(config.url, config.publishableKey, {
    auth: {
      // The session is saved encrypted (src/lib/session-storage.ts) and restored on launch.
      storage,
      persistSession: true,
      // supabase-js only refreshes while told to: see watchAppStateForRefresh below.
      autoRefreshToken: true,
      // A native app has no session in its URL.
      detectSessionInUrl: false,
    },
  });
}

// One lazy, memoised client. It is lazy so the app, the tests, and CI work with no Supabase
// variables set: the error appears only when something asks for the client.
export function createSupabaseGetter(read: () => SupabaseEnv | undefined): () => AppSupabaseClient {
  let client: AppSupabaseClient | undefined;

  return () => {
    if (client) {
      return client;
    }
    const config = read();
    if (!config) {
      throw new Error(
        'Supabase is not configured: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (copy .env.example to .env).',
      );
    }
    client = createSupabaseClient(config);
    return client;
  };
}

export const getSupabase = createSupabaseGetter(() => env.supabase);

// In React Native supabase-js does not know when the app is in the background, so it must be
// told: refresh runs while the app is in the foreground and stops in the background. On
// coming back it renews an expired token before anything else asks for it.
export function watchAppStateForRefresh(client: AppSupabaseClient): () => void {
  const apply = (state: string) => {
    if (state === 'active') {
      void client.auth.startAutoRefresh();
    } else {
      void client.auth.stopAutoRefresh();
    }
  };

  // An unknown state at launch means the app has only just opened in the foreground.
  apply(AppState.currentState ?? 'active');
  const subscription = AppState.addEventListener('change', apply);

  return () => {
    subscription.remove();
    void client.auth.stopAutoRefresh();
  };
}

let stopWatching: (() => void) | undefined;

// Called once from the root layout. It does nothing when Supabase is not configured, so the app
// still starts with no backend, and a second call while one is running changes nothing.
export function startSessionRefresh(): () => void {
  if (!env.supabase || stopWatching) {
    return () => undefined;
  }
  const stop = watchAppStateForRefresh(getSupabase());
  stopWatching = () => {
    stop();
    stopWatching = undefined;
  };
  return stopWatching;
}
