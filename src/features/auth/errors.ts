import { isAuthApiError, isAuthRetryableFetchError } from '@supabase/supabase-js';

import { OTP_LIFETIME_SECONDS, type AuthErrorCode, type AuthFailure } from './types';

// The one place that turns a Supabase auth error into a stable code and its message
// (STRUCTURE.md: server errors are mapped to UI messages in one place). The original error text
// is dropped on purpose: it could echo an address, a code, or a token.

export const AUTH_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_EMAIL: 'Enter a valid email address.',
  RATE_LIMITED: 'Too many codes requested. Try again in a little while.',
  OFFLINE: "You're offline. Check your connection and try again.",
  CODE_WRONG: 'That code is not right. Check it and try again.',
  CODE_EXPIRED: 'This code has expired. Send a new one.',
  SEND_FAILED: 'We could not send the code. Try again.',
  VERIFY_FAILED: 'Something went wrong. Try again.',
};

export function authFailure(code: AuthErrorCode): AuthFailure {
  return { code, message: AUTH_MESSAGES[code] };
}

/** True once more than the code's lifetime has passed since it was requested. */
export function isCodeExpired(requestedAt: number, now: number): boolean {
  return now - requestedAt > OTP_LIFETIME_SECONDS * 1000;
}

const RATE_LIMIT_CODES = new Set(['over_email_send_rate_limit', 'over_request_rate_limit']);

// A failure that is the same whatever the user was doing.
function commonCode(error: unknown): AuthErrorCode | undefined {
  // supabase-js reports a missing connection as a retryable fetch error with status 0. A 5xx
  // from the server is also "retryable" but is not the user's connection.
  if (isAuthRetryableFetchError(error) && error.status === 0) {
    return 'OFFLINE';
  }
  if (isAuthApiError(error) && (error.status === 429 || RATE_LIMIT_CODES.has(error.code ?? ''))) {
    return 'RATE_LIMITED';
  }
  return undefined;
}

/** A failed request for a code. */
export function mapSendError(error: unknown): AuthFailure {
  const common = commonCode(error);
  if (common) {
    return authFailure(common);
  }
  if (
    isAuthApiError(error) &&
    ['email_address_invalid', 'validation_failed'].includes(error.code ?? '')
  ) {
    return authFailure('INVALID_EMAIL');
  }
  return authFailure('SEND_FAILED');
}

/**
 * A failed check of a code. Supabase answers a wrong code and an expired code with the same
 * `otp_expired` error, so the clock decides: the code is "expired" once its lifetime has passed.
 * `requestedAt` is taken before the request was sent, so the app never thinks a code is still
 * fresh after the server has expired it.
 */
export function mapVerifyError(error: unknown, requestedAt: number, now: number): AuthFailure {
  const common = commonCode(error);
  if (common) {
    return authFailure(common);
  }
  if (isAuthApiError(error) && error.code === 'otp_expired') {
    return authFailure(isCodeExpired(requestedAt, now) ? 'CODE_EXPIRED' : 'CODE_WRONG');
  }
  return authFailure('VERIFY_FAILED');
}
