import { useCallback, useRef, useState } from 'react';

import { signOut } from '../api';

/**
 * Signs the user out of this device. `isSigningOut` is true while it works, and a second call
 * while the first is running does nothing. The app moves to the Welcome screen by itself when
 * the sign-in state changes (the route guard), so there is nothing to navigate here.
 */
export function useSignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const running = useRef(false);

  const run = useCallback(async () => {
    if (running.current) {
      return;
    }
    running.current = true;
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      running.current = false;
      setIsSigningOut(false);
    }
  }, []);

  return { signOut: run, isSigningOut };
}
