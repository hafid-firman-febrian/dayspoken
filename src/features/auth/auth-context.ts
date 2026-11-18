import { createContext } from 'react';

import type { AuthState } from './types';

// Null outside an AuthProvider, so useSession() can say what is wrong instead of returning a
// state that looks real.
export const AuthContext = createContext<AuthState | null>(null);
