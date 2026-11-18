# Proposal

## Why

Dayspoken has a design system and a backend with row-level security, but nobody can sign in: every table is closed to anonymous visitors and the app opens on a placeholder. Real authentication is the first thing an Upwork client sees and one of the portfolio signals ("production-grade: real auth, clear error states, safe data"). It also unblocks every later change, because entries, quotas, and Ask all belong to a signed-in user.

This change implements ROADMAP.md entry **4. add-email-otp-auth** and stays within its scope.

## What Changes

- **Welcome screen (S01):** value proposition, a "Get started" button, a "Try the demo" button that is a visible placeholder until `add-demo-account`, and the privacy notice that audio is processed by Google Gemini's free tier.
- **Sign In screen (S02):** an email field with invalid-email and loading states, which asks Supabase Auth to email a 6-digit code.
- **Verify Code screen (S03):** the 6-digit `CodeInput`, a resend button with a 60-second timer, and wrong-code, expired-code, and rate-limited states.
- **Email delivery:** Supabase's built-in email is for testing only (2 messages per hour, and only to members of the project's organization), so the codes go out through a free SMTP provider (Gmail app password or Brevo). The email template shows the code, not a link. The SMTP credentials live only in Supabase.
- **Secure session:** the session is saved on the device in encrypted storage whose key sits in the platform keystore, restored on launch, and refreshed in the background while the app is in the foreground.
- **Routing guard:** signed-out users can reach only the `(auth)` routes, and signed-in users never see them. The splash screen stays up until the saved session has been read.
- **Sign out:** an action in the `auth` feature, reachable for now from a temporary button on the home placeholder (the real button belongs to Settings, in `add-settings-account`).
- **BREAKING (internal):** the Supabase client stops running with `persistSession: false` and `autoRefreshToken: false`. The `supabase-client` requirement "No stored session yet" is removed and replaced.
- **Docs:** `STRUCTURE.md` gets the auth feature, the session storage rule, and the SMTP setup. `.env.example` is unchanged (the app gets no new variable).

**Cost impact: Rp 0.** The new dependency `expo-secure-store` is part of the Expo SDK and free. Gmail SMTP and Brevo's free plan cost nothing. Supabase Free allows custom SMTP at no charge (the email rate limit goes from 2 to 30 messages per hour once custom SMTP is on, and is adjustable). No paid service is added.

## Capabilities

### New Capabilities

- `email-otp-sign-in`: the Sign In and Verify Code screens and the OTP flow: sending a code, entering it, resending with a timer, and the states for invalid email, wrong code, expired code, and rate limiting.
- `welcome-screen`: the Welcome screen with the value proposition, "Get started", the placeholder "Try the demo" button, and the Gemini privacy notice.
- `auth-session`: how the session is kept on the device (encrypted, key in the keystore), restored, refreshed, and ended by sign out.
- `auth-route-guard`: which routes a signed-out and a signed-in user can reach, and the splash behavior while the session is read.
- `auth-email-delivery`: the Supabase Auth email OTP configuration: code length and expiry, the code-only email template, the SMTP provider and its secrets, and the rate limits.

### Modified Capabilities

- `supabase-client`: the client now persists and refreshes the session through secure storage. The requirement "No stored session yet" is removed and replaced.

## Impact

- **App code:** new `src/features/auth/` (screens' components, hooks, `api.ts`, `types.ts`, `index.ts`); new routes `app/(auth)/welcome.tsx`, `sign-in.tsx`, `verify.tsx` and an `app/(auth)/_layout.tsx`; `app/_layout.tsx` gains the auth provider and the guard; `app/index.tsx` gets a temporary "Sign out" button; `src/lib/supabase.ts` turns session persistence on; a new session-storage adapter in `src/lib` (and a small extension of `src/lib/mmkv.ts`, the only file that may import MMKV).
- **Dependencies:** `expo-secure-store` (Expo SDK 58, free). This needs a native rebuild of the development build.
- **Backend:** `supabase/config.toml` (OTP expiry, resend interval, rate limit, SMTP block that reads secrets from environment variables) and `supabase/templates/` (the code-only email template). No schema migration, no new table: the existing `handle_new_user` trigger already creates the profile row when the auth user is created.
- **Cloud project:** the owner sets the SMTP credentials, the code length and lifetime, and the two email templates by hand in the Supabase dashboard (`supabase config push` would overwrite unrelated cloud settings). This is a manual step documented in `docs/`.
- **Docs:** `STRUCTURE.md` (auth feature, session storage, SMTP), `ROADMAP.md` (tick the boxes during apply).
- **Does not change** `openspec/config.yaml` or any agreed decision. Email OTP through free SMTP and a "Try the demo" button are already agreed.

## Out of scope

- The tab shell and its placeholder screens (`add-app-shell-navigation`).
- Making "Try the demo" work: the demo account, its seed data, and demo sign-in (`add-demo-account`).
- The Settings screen, including its sign-out button and Delete Account (`add-settings-account`).
- Google and Apple sign-in (Later: `add-social-login`).
- Password sign-in, magic-link sign-in, and phone sign-in.
- App Lock and biometrics (`add-app-lock`).
- Clearing cached server data on sign out: there is no cache yet. The change that introduces TanStack Query (the first data screen) hooks into sign out.
- The privacy policy page itself (`prepare-portfolio-release`).
