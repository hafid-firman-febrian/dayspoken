import type { Session } from '@supabase/supabase-js';
import { useEffect, useState, type ReactNode } from 'react';

import { getSupabase, type AppSupabaseClient } from '@/lib/supabase';

import { AuthContext } from './auth-context';
import type { AuthState } from './types';

const LOADING: AuthState = { status: 'loading', session: null };
const SIGNED_OUT: AuthState = { status: 'signed-out', session: null };

function toState(session: Session | null): AuthState {
  return session ? { status: 'signed-in', session } : SIGNED_OUT;
}

type Props = {
  children: ReactNode;
  /** For tests. Defaults to the app's client. */
  client?: AppSupabaseClient;
};

/**
 * Holds the sign-in state for the whole app (design D2). supabase-js owns the session: it saves
 * it, refreshes it, and tells us when it changes. This only mirrors that into React state, so
 * there is one source of truth. The state is `loading` until the saved session has been read,
 * and it never stays there: a failed read means signed out.
 */
export function AuthProvider({ children, client }: Props) {
  const [state, setState] = useState<AuthState>(LOADING);

  useEffect(() => {
    let active = true;
    let sawEvent = false;
    let unsubscribe: (() => void) | undefined;

    const apply = (session: Session | null) => {
      if (active) {
        setState(toState(session));
      }
    };

    try {
      const auth = (client ?? getSupabase()).auth;

      // Only set state here. Awaiting another supabase call inside this callback can deadlock the
      // client.
      const { data } = auth.onAuthStateChange((_event, session) => {
        sawEvent = true;
        apply(session);
      });
      unsubscribe = () => data.subscription.unsubscribe();

      auth
        .getSession()
        .then(({ data: sessionData }) => {
          // An event is newer than this read, so it wins.
          if (!sawEvent) {
            apply(sessionData.session);
          }
        })
        .catch(() => {
          if (!sawEvent) {
            apply(null);
          }
        });
    } catch {
      // No backend configured, or the client could not start: the app is simply signed out.
      apply(null);
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [client]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
