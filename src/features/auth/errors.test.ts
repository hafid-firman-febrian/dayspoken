import { AuthApiError, AuthRetryableFetchError, AuthUnknownError } from '@supabase/supabase-js';

import { AUTH_MESSAGES, authFailure, isCodeExpired, mapSendError, mapVerifyError } from './errors';
import { OTP_LIFETIME_SECONDS } from './types';

const LIFETIME_MS = OTP_LIFETIME_SECONDS * 1000;
const apiError = (message: string, status: number, code?: string) =>
  new AuthApiError(message, status, code);

describe('mapSendError', () => {
  it.each(['over_email_send_rate_limit', 'over_request_rate_limit'])(
    'maps %s to RATE_LIMITED',
    (code) => {
      expect(mapSendError(apiError('slow down', 429, code)).code).toBe('RATE_LIMITED');
    },
  );

  it('maps a bare HTTP 429 to RATE_LIMITED', () => {
    expect(mapSendError(apiError('slow down', 429)).code).toBe('RATE_LIMITED');
  });

  it('maps a missing connection (status 0) to OFFLINE', () => {
    expect(mapSendError(new AuthRetryableFetchError('Network request failed', 0)).code).toBe(
      'OFFLINE',
    );
  });

  it('does not call a server outage OFFLINE', () => {
    expect(mapSendError(new AuthRetryableFetchError('Service Unavailable', 503)).code).toBe(
      'SEND_FAILED',
    );
  });

  it.each(['email_address_invalid', 'validation_failed'])('maps %s to INVALID_EMAIL', (code) => {
    expect(mapSendError(apiError('bad address', 422, code)).code).toBe('INVALID_EMAIL');
  });

  it('maps a refused SMTP send to SEND_FAILED', () => {
    expect(
      mapSendError(apiError('Error sending magic link email', 500, 'unexpected_failure')).code,
    ).toBe('SEND_FAILED');
  });

  it('maps the built-in email refusing an outside address to SEND_FAILED', () => {
    expect(
      mapSendError(apiError('Email address not authorized', 400, 'email_address_not_authorized'))
        .code,
    ).toBe('SEND_FAILED');
  });

  it('maps anything unknown to SEND_FAILED', () => {
    expect(mapSendError(new AuthUnknownError('???', new Error('x'))).code).toBe('SEND_FAILED');
    expect(mapSendError(new Error('plain')).code).toBe('SEND_FAILED');
    expect(mapSendError('a string').code).toBe('SEND_FAILED');
  });
});

describe('mapVerifyError', () => {
  const otpRejected = apiError('Token has expired or is invalid', 403, 'otp_expired');
  const REQUESTED_AT = 1_000_000;

  it('calls a rejected code WRONG while the code is still within its lifetime', () => {
    expect(mapVerifyError(otpRejected, REQUESTED_AT, REQUESTED_AT + 5_000).code).toBe('CODE_WRONG');
  });

  it('calls a rejected code EXPIRED once its lifetime has passed', () => {
    expect(mapVerifyError(otpRejected, REQUESTED_AT, REQUESTED_AT + LIFETIME_MS + 1).code).toBe(
      'CODE_EXPIRED',
    );
  });

  it('still calls a code WRONG at exactly the end of its lifetime', () => {
    expect(mapVerifyError(otpRejected, REQUESTED_AT, REQUESTED_AT + LIFETIME_MS).code).toBe(
      'CODE_WRONG',
    );
  });

  it('maps rate limiting and a missing connection the same way as sending', () => {
    expect(mapVerifyError(apiError('x', 429, 'over_request_rate_limit'), 0, 0).code).toBe(
      'RATE_LIMITED',
    );
    expect(
      mapVerifyError(new AuthRetryableFetchError('Network request failed', 0), 0, 0).code,
    ).toBe('OFFLINE');
  });

  it('maps any other failure to VERIFY_FAILED', () => {
    expect(mapVerifyError(apiError('boom', 500, 'unexpected_failure'), 0, 0).code).toBe(
      'VERIFY_FAILED',
    );
    expect(mapVerifyError(new Error('plain'), 0, 0).code).toBe('VERIFY_FAILED');
  });
});

describe('isCodeExpired', () => {
  it('is false at the lifetime and true one millisecond after', () => {
    expect(isCodeExpired(0, LIFETIME_MS)).toBe(false);
    expect(isCodeExpired(0, LIFETIME_MS + 1)).toBe(true);
  });
});

describe('messages', () => {
  it('has the agreed English text for every code', () => {
    expect(AUTH_MESSAGES).toEqual({
      INVALID_EMAIL: 'Enter a valid email address.',
      RATE_LIMITED: 'Too many codes requested. Try again in a little while.',
      OFFLINE: "You're offline. Check your connection and try again.",
      CODE_WRONG: 'That code is not right. Check it and try again.',
      CODE_EXPIRED: 'This code has expired. Send a new one.',
      SEND_FAILED: 'We could not send the code. Try again.',
      VERIFY_FAILED: 'Something went wrong. Try again.',
    });
  });

  it('never carries the raw server text, an address, a code, or a token', () => {
    const secret = 'ada@example.com 123456 eyJhbGciOi.token';
    const failures = [
      mapSendError(apiError(secret, 500, 'unexpected_failure')),
      mapSendError(apiError(secret, 429, 'over_email_send_rate_limit')),
      mapSendError(new AuthRetryableFetchError(secret, 0)),
      mapVerifyError(apiError(secret, 403, 'otp_expired'), 0, 0),
      mapVerifyError(apiError(secret, 403, 'otp_expired'), 0, LIFETIME_MS * 2),
      mapVerifyError(new Error(secret), 0, 0),
    ];
    for (const failure of failures) {
      expect(JSON.stringify(failure)).not.toContain('ada@example.com');
      expect(JSON.stringify(failure)).not.toContain('123456');
      expect(JSON.stringify(failure)).not.toContain('eyJhbGciOi');
    }
  });

  it('builds a failure from a code', () => {
    expect(authFailure('OFFLINE')).toEqual({ code: 'OFFLINE', message: AUTH_MESSAGES.OFFLINE });
  });
});
