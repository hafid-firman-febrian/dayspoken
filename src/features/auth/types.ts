import type { Session } from '@supabase/supabase-js';

/** Digits in a sign-in code. Mirrors `otp_length` in supabase/config.toml. */
export const OTP_LENGTH = 6;

/**
 * How long a sign-in code works, in seconds. Mirrors `otp_expiry` in supabase/config.toml, and
 * a test keeps the two equal. The server answers a wrong code and an expired code with the same
 * error, so the app uses this to tell them apart (see errors.ts).
 */
export const OTP_LIFETIME_SECONDS = 600;

/** How long before another code may be requested. Mirrors `max_frequency` in config.toml. */
export const RESEND_SECONDS = 60;

/** Stable codes for everything that can go wrong signing in. Messages are in errors.ts. */
export type AuthErrorCode =
  | 'INVALID_EMAIL'
  | 'RATE_LIMITED'
  | 'OFFLINE'
  | 'CODE_WRONG'
  | 'CODE_EXPIRED'
  | 'SEND_FAILED'
  | 'VERIFY_FAILED';

export type AuthFailure = {
  code: AuthErrorCode;
  /** Ready to show to the user. Never holds a raw server message, a code, or a token. */
  message: string;
};

export type AuthResult = { ok: true } | { ok: false; error: AuthFailure };

export type AuthState =
  | { status: 'loading'; session: null }
  | { status: 'signed-out'; session: null }
  | { status: 'signed-in'; session: Session };
