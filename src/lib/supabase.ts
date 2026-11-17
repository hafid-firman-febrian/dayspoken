// React Native's built-in URL is incomplete and supabase-js needs the full one.
import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../supabase/functions/_shared/database.types';
import { env, type SupabaseEnv } from './env';

// The app talks to Supabase only with the publishable key, so it only reaches what row-level
// security allows. Secret keys live in Supabase, never here (env.ts refuses them).
export type AppSupabaseClient = SupabaseClient<Database>;

export function createSupabaseClient(config: SupabaseEnv): AppSupabaseClient {
  return createClient<Database>(config.url, config.publishableKey, {
    // No stored session yet: secure session storage arrives with the sign-in change
    // (add-email-otp-auth), which turns these on.
    auth: {
      persistSession: false,
      autoRefreshToken: false,
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
