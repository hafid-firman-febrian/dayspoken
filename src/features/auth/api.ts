import { z } from 'zod';

import { getSupabase, type AppSupabaseClient } from '@/lib/supabase';

import { authFailure, mapSendError, mapVerifyError } from './errors';
import { OTP_LENGTH, type AuthFailure } from './types';

// The only file in the feature that calls supabase.auth (STRUCTURE.md: a feature's api.ts is the
// only place that talks to Supabase). Every function returns a result instead of throwing, so a
// screen never has to guess what a failure looks like.

type Options = {
  /** For tests. Defaults to the app's client. */
  client?: AppSupabaseClient;
  /** For tests. Defaults to the real clock. */
  now?: () => number;
};

const emailSchema = z.email();

/** The address as it is sent: no surrounding spaces, all lowercase. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: string): boolean {
  return emailSchema.safeParse(normalizeEmail(raw)).success;
}

export type SendCodeResult =
  | {
      ok: true;
      /** The address the code was sent to, as sent. */
      email: string;
      /** When the request started. The expiry of the code is counted from here (errors.ts). */
      requestedAt: number;
    }
  | { ok: false; error: AuthFailure };

// A developer who forgot .env sees why in the console. The user sees the generic message.
function warnIfNotConfigured(error: unknown): void {
  if (__DEV__ && error instanceof Error && error.message.startsWith('Supabase is not configured')) {
    console.warn(error.message);
  }
}

/**
 * Emails a six digit code. An address with no account gets one, so signing in and signing up are
 * the same action.
 */
export async function sendCode(
  rawEmail: string,
  { client, now = Date.now }: Options = {},
): Promise<SendCodeResult> {
  if (!isValidEmail(rawEmail)) {
    return { ok: false, error: authFailure('INVALID_EMAIL') };
  }

  const email = normalizeEmail(rawEmail);
  const requestedAt = now();
  try {
    const { error } = await (client ?? getSupabase()).auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      return { ok: false, error: mapSendError(error) };
    }
    return { ok: true, email, requestedAt };
  } catch (error) {
    warnIfNotConfigured(error);
    return { ok: false, error: mapSendError(error) };
  }
}

export type VerifyCodeResult = { ok: true } | { ok: false; error: AuthFailure };

/**
 * Checks the code. On success the session is saved by the client, and the auth state changes by
 * itself (AuthProvider listens), so this returns nothing but the outcome.
 */
export async function verifyCode(
  rawEmail: string,
  code: string,
  requestedAt: number,
  { client, now = Date.now }: Options = {},
): Promise<VerifyCodeResult> {
  // The code input only ever holds digits, but nothing should be sent that cannot be a code.
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code)) {
    return { ok: false, error: authFailure('CODE_WRONG') };
  }

  try {
    const { data, error } = await (client ?? getSupabase()).auth.verifyOtp({
      email: normalizeEmail(rawEmail),
      token: code,
      type: 'email',
    });
    if (error) {
      return { ok: false, error: mapVerifyError(error, requestedAt, now()) };
    }
    if (!data.session) {
      return { ok: false, error: authFailure('VERIFY_FAILED') };
    }
    return { ok: true };
  } catch (error) {
    warnIfNotConfigured(error);
    return { ok: false, error: mapVerifyError(error, requestedAt, now()) };
  }
}

/**
 * Signs out of this device only (other devices stay signed in). supabase-js removes the local
 * session before it asks the server to revoke the refresh token, so the device is signed out
 * even when the request fails (offline): the outcome is the same either way.
 */
export async function signOut({ client }: Pick<Options, 'client'> = {}): Promise<void> {
  try {
    await (client ?? getSupabase()).auth.signOut({ scope: 'local' });
  } catch (error) {
    warnIfNotConfigured(error);
  }
}
