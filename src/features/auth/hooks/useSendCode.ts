import { useCallback, useRef, useState } from 'react';

import { sendCode, type SendCodeResult } from '../api';

/**
 * Requests a sign-in code. `isSending` is true while it works, and a second call while the first
 * is running does nothing (it returns `undefined`), so a double press sends one email.
 */
export function useSendCode() {
  const [isSending, setIsSending] = useState(false);
  const running = useRef(false);

  const send = useCallback(async (email: string): Promise<SendCodeResult | undefined> => {
    if (running.current) {
      return undefined;
    }
    running.current = true;
    setIsSending(true);
    try {
      return await sendCode(email);
    } finally {
      running.current = false;
      setIsSending(false);
    }
  }, []);

  return { send, isSending };
}
