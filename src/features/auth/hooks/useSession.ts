import { useContext } from 'react';

import { AuthContext } from '../auth-context';
import type { AuthState } from '../types';

/** The current sign-in state: `loading`, `signed-out`, or `signed-in` with its session. */
export function useSession(): AuthState {
  const state = useContext(AuthContext);
  if (!state) {
    throw new Error('useSession must be used inside an AuthProvider.');
  }
  return state;
}
