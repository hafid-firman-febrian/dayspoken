import { useEffect, useReducer } from 'react';
import { AppState } from 'react-native';

import { RESEND_SECONDS } from '../types';

export type ResendTimer = {
  /** Whole seconds left before another code may be requested. 0 once it may. */
  secondsLeft: number;
  canResend: boolean;
};

const TICK_MS = 1000;

const secondsUntilResend = (sentAt: number, at: number) =>
  Math.max(0, Math.ceil((sentAt + RESEND_SECONDS * 1000 - at) / 1000));

/**
 * Counts down to when a new code may be requested, from `sentAt` (a time in milliseconds). The
 * time left is worked out from the clock on every render, and the timer only asks for a new
 * render each second and whenever the app comes back to the foreground. It is never a counter
 * that goes down by one: a counter stops while the app is in the background and would show a
 * stale time afterwards.
 */
export function useResendTimer(sentAt: number, now: () => number = Date.now): ResendTimer {
  const [, render] = useReducer((count: number) => count + 1, 0);
  const secondsLeft = secondsUntilResend(sentAt, now());

  useEffect(() => {
    // Nothing to count when the time is already up. Otherwise tick until it is.
    const interval =
      secondsUntilResend(sentAt, now()) === 0
        ? undefined
        : setInterval(() => {
            render();
            if (secondsUntilResend(sentAt, now()) === 0) {
              clearInterval(interval);
            }
          }, TICK_MS);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        render();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [sentAt, now]);

  return { secondsLeft, canResend: secondsLeft === 0 };
}
