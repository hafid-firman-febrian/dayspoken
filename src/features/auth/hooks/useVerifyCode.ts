import { useCallback, useRef, useState } from 'react';

import { verifyCode, type VerifyCodeResult } from '../api';

/**
 * Checks a sign-in code. `isVerifying` is true while it works, and a second call while the first
 * is running does nothing (it returns `undefined`). On success the session is saved and the auth
 * state changes by itself, so the route guard moves the user: there is nothing to navigate.
 */
export function useVerifyCode() {
  const [isVerifying, setIsVerifying] = useState(false);
  const running = useRef(false);

  const verify = useCallback(
    async (
      email: string,
      code: string,
      requestedAt: number,
    ): Promise<VerifyCodeResult | undefined> => {
      if (running.current) {
        return undefined;
      }
      running.current = true;
      setIsVerifying(true);
      try {
        return await verifyCode(email, code, requestedAt);
      } finally {
        running.current = false;
        setIsVerifying(false);
      }
    },
    [],
  );

  return { verify, isVerifying };
}
