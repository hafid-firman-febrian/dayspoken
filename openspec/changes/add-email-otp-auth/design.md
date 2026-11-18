# Design

## Context

See `proposal.md` for the why. State of the code today:

- `src/lib/supabase.ts` builds the client with `persistSession: false` and `autoRefreshToken: false`, with a comment that this change turns them on. The client is lazy (`getSupabase()`), so tests and CI run with no Supabase variables.
- `src/lib/mmkv.ts` is the only file allowed to import `react-native-mmkv` (ESLint). Its `kvStorage` is a plain, unencrypted, synchronous adapter used for preferences.
- `app/_layout.tsx` renders `<Stack>` inside `GestureHandlerRootView > ThemeProvider > UiProvider`, after a font gate. `app/index.tsx` is a placeholder. There are no `(auth)` routes and no `src/features/` folder yet.
- `src/ui` already has `Screen`, `Text`, `Button`, `TextField`, `CodeInput` (6 cells, autofill, `onComplete`), `Banner`, `ErrorState`, and `useToast`. `TextField` and `CodeInput` have error states.
- `supabase/config.toml` has email OTP on (`otp_length = 6`, `otp_expiry = 3600`, `enable_confirmations = false`), no SMTP block, and `[auth.rate_limit] email_sent = 2` (which only applies once SMTP is on). The local mailbox ("Mailpit") is on port 54424. `handle_new_user` already creates a `profiles` row on `auth.users` insert, so no migration is needed.
- `@tanstack/react-query` is listed in the stack but is **not installed yet**. Expo Router is `~58`, which has `Stack.Protected`.
- Facts checked against Supabase's docs on 2026-11-18: the built-in email service sends 2 messages per hour and only to members of the project's organization; custom SMTP raises the default to 30 per hour (adjustable); a user can request an OTP once every 60 seconds; `/otp` and `/verify` are limited to 30 requests per 5 minutes per IP; the default OTP lifetime is 1 hour; email OTP uses the Magic Link template.

## Goals / Non-Goals

**Goals:**

- A returning user opens the app straight into the signed-in area; a new user can go from Welcome to signed in with only an email inbox.
- The session never sits on the device in plain text.
- Every failure a user can meet (bad address, wrong code, expired code, rate limit, offline, provider down) has a plain-words message and a way forward.
- The auth feature is a clean seam for the later changes: `add-app-shell-navigation` replaces the signed-in placeholder, `add-demo-account` fills the demo button, `add-settings-account` moves sign out.

**Non-Goals:**

- No new server-side code (no Edge Function, no migration, no database hook).
- No cache clearing on sign out (no cache exists yet).
- No auth analytics or Sentry events (monitoring is `add-monitoring-e2e`).
- No custom brute-force counter. Supabase's per-IP verify limit and the 10-minute code lifetime are the protection for now (see Risks).

## Decisions

### D1. The session lives in an encrypted MMKV store whose key is in the platform keystore

`supabase-js` stores its session as one JSON string that is routinely larger than the 2 KB that `expo-secure-store` handles reliably, so the session itself cannot go straight into it. Instead:

1. On first use, generate a random 32-byte key and save it in `expo-secure-store` (Keychain on iOS, Keystore-backed on Android).
2. Open a second, separate MMKV instance (`id: 'dayspoken-auth'`, `encryptionType: 'AES-256'`, that key) and give `supabase-js` a `getItem/setItem/removeItem` adapter on top of it.

`src/lib/mmkv.ts` stays the only file that imports MMKV: it gains a small `createEncryptedKvStorage(id, key)` factory. A new `src/lib/session-storage.ts` owns the key handling and returns the adapter for the client. The preferences instance is untouched, so theme mode and other settings keep working, and the session is not mixed with cache data.

`expo-secure-store` has a synchronous `getItem`, so the whole read path stays synchronous and the session is known as early as MMKV allows. Where the key is missing or the encrypted file cannot be decrypted (a backup restored on another device, a reinstall that kept the file, a keystore reset), the store is wiped and the user is simply signed out: a re-sign-in costs one email, which is cheaper than a crash loop.

Alternatives considered:

- **Everything in `expo-secure-store`, chunked.** Works, but each chunk is a keystore call, the 2 KB guidance is a platform limit we would be fighting, and every token refresh rewrites several entries.
- **`@react-native-async-storage/async-storage` with an AES library** (the pattern in Supabase's own React Native guide). It adds two dependencies and JS-side crypto when MMKV already does native AES.
- **The plain `kvStorage` (MMKV without a key).** Rejected: STRUCTURE.md says the session is stored securely, and an unencrypted file can be copied out of a device backup.

### D2. The session is React context fed by `onAuthStateChange`, not TanStack Query

STRUCTURE.md says server data lives only in TanStack Query and Zustand holds UI state only. A session is neither: `supabase-js` owns it, persists it, refreshes it, and emits events when it changes. Mirroring that into a query cache would create two sources of truth. `AuthProvider` (in `src/features/auth`) therefore holds `{ status: 'loading' | 'signed-in' | 'signed-out', session }` in React state, initialized with `getSession()` and updated from `onAuthStateChange`. A `useSession()` hook reads it.

This is a small, deliberate deviation. It is written into STRUCTURE.md in this change ("Auth state"), including the rule that a later change that adds TanStack Query clears that cache on sign out. TanStack Query is not added here: there is no server data to cache yet, and adding the library without a user would be scope creep.

The send-code and verify-code actions are plain async functions in `api.ts` (the only place in the feature that calls `supabase.auth`), used by local hook state in the screens. They are not query mutations, for the same reason.

### D3. The guard is `Stack.Protected` in the root layout

`app/_layout.tsx` wraps the navigator in `AuthProvider` and renders:

```text
<Stack>
  <Stack.Protected guard={status === 'signed-out'}>   -> (auth)
  <Stack.Protected guard={status === 'signed-in'}>    -> index (the signed-in home)
  <Stack.Screen name="dev/gallery" />                 -> always registered, see D8
</Stack>
```

Expo Router removes a protected screen from the navigator when its guard turns false, so the back stack cannot hold a screen from the wrong area and a deep link to it falls through to the first allowed route. Alternatives: a `<Redirect>` in each screen (easy to forget, flashes the wrong screen) or a `useEffect` that calls `router.replace` (a visible flash and a race with navigation). `Stack.Protected` is the framework's own mechanism.

Provider order in `app/_layout.tsx`, outermost first: `AuthProvider`, the font and session gate, `GestureHandlerRootView`, `ThemeProvider`, `UiProvider`, navigator. `AuthProvider` sits outside the gate because the gate must know when the saved session has been read. It needs no theme or fonts, and the screens below the navigator still reach it and can use toasts.

The gate extends the existing font gate: `useAppFonts({ hold })` hides the splash screen only when fonts are ready **and** `hold` is false, and the root layout holds it while the session state is `loading`. The option is off by default, so the fonts behavior is unchanged. A failed read resolves to `signed-out`, never to an endless splash. `(auth)` sets `anchor: 'welcome'` (routes are alphabetical, which would open Sign In first). The router also does not know a route its guard is closed to, so a signed-out launch at `/` would land on the "not found" screen: `app/+not-found.tsx` redirects to `/welcome` (signed out) or `/` (signed in). Found by the route tests while applying. This is covered by route tests and by a manual check on a device.

### D4. Routes and files

```text
app/
  _layout.tsx                  AuthProvider + the guard
  (auth)/
    _layout.tsx                Stack for the three screens
    welcome.tsx                thin: renders <WelcomeScreen />
    sign-in.tsx                thin: renders <SignInScreen />
    verify.tsx                 thin: renders <VerifyCodeScreen /> (reads ?email=)
  index.tsx                    placeholder + temporary "Sign out"
src/features/auth/
  components/                  WelcomeScreen, SignInScreen, VerifyCodeScreen
  hooks/                       useSession, useSendCode, useVerifyCode, useResendTimer, useSignOut
  AuthProvider.tsx
  api.ts                       sendCode, verifyCode, signOut (the only supabase.auth calls)
  errors.ts                    maps Supabase auth errors to stable codes and UI messages
  types.ts
  index.ts                     public API: AuthProvider, useSession, useSignOut
src/lib/
  mmkv.ts                      + createEncryptedKvStorage
  session-storage.ts           key in secure store, encrypted store, adapter for supabase-js
  supabase.ts                  persistSession/autoRefreshToken on + storage; AppState wiring
```

The email travels from Sign In to Verify Code as a route parameter (`/verify?email=…`). The address is not secret from the device that typed it, and a parameter survives a process restart on the verify screen better than in-memory state. The sent-at time is held by the verify screen's state (it is the same moment the screen opened or the user resent), and `useResendTimer` computes "seconds left" from `Date.now()` against it on each tick and on `AppState` change, never from a decrementing counter.

### D5. Error handling: one mapping, stable codes

`errors.ts` converts whatever `supabase-js` returns into a small set of stable app codes, and the UI maps code to text in the same file (STRUCTURE.md: "mapped to UI messages in one place"):

| App code | Source | Message |
|---|---|---|
| `INVALID_EMAIL` | client Zod check, or `email_address_invalid` / `validation_failed` | "Enter a valid email address." |
| `RATE_LIMITED` | `over_email_send_rate_limit`, `over_request_rate_limit`, HTTP 429 | "Too many codes requested. Try again in a little while." |
| `OFFLINE` | `AuthRetryableFetchError` with status 0 / no connection | "You're offline. Check your connection and try again." |
| `CODE_WRONG` | `otp_expired` while inside the code lifetime | "That code is not right. Check it and try again." |
| `CODE_EXPIRED` | `otp_expired` after the code lifetime | "This code has expired. Send a new one." |
| `SEND_FAILED` | anything else while sending (including a refused SMTP send) | "We could not send the code. Try again." |
| `VERIFY_FAILED` | anything else while verifying | "Something went wrong. Try again." |

**Wrong versus expired.** Supabase answers both a wrong code and an expired code with the same `otp_expired` error ("Token has expired or is invalid"). The two states in the screen design therefore cannot come from the server. The app tells them apart with the clock: it knows when it sent the code and the lifetime it configured (`OTP_LIFETIME_SECONDS = 600`, mirrored from `otp_expiry` in `config.toml` with a test that reads both files so they cannot drift). A rejection after that time is "expired", a rejection before it is "wrong". The one case this gets wrong is a user who requested a second code elsewhere and types the first: the server says the first is invalid, and the app says "wrong", which is true.

No code, token, or raw server message is logged or shown; the mapping drops the original message and keeps only the code.

### D6. Email: 6 digits, 10 minutes, one template for both paths

- `otp_length = 6` (unchanged), `otp_expiry = 600` (from 3600): a shorter life is safer, and 10 minutes covers slow mail.
- `max_frequency = "1m0s"` so the 60-second resend interval is enforced by the server, not only by the app's timer.
- `[auth.rate_limit] email_sent = 30` (the Free-plan default once custom SMTP is on, written down so it is visible and adjustable).
- `signInWithOtp({ email, options: { shouldCreateUser: true } })`, so signing in and signing up are one flow. `enable_confirmations` stays `false`, so a new user needs no separate confirmation step.
- A new address receives the **Confirm signup** template, an existing one the **Magic Link** template. Both templates in `supabase/templates/` therefore render the same code-only HTML (`{{ .Token }}`, no `{{ .ConfirmationURL }}`), referenced from `config.toml` (`[auth.email.template.confirmation]` and `[auth.email.template.magic_link]`) and with a subject such as "Your Dayspoken code". The wording is checked at apply time against both a new and an existing address.
- Email templates are plain HTML with inline styles (mail clients ignore CSS variables and dark-mode tokens). The hex colors in that file are the one place the "no hex colors" rule does not apply: it is a mail template, outside `app/` and `src/`, and ESLint does not see it.

### D7. SMTP provider and how secrets reach Supabase

Two free options, owner's choice, one config block:

| | Gmail app password | Brevo free |
|---|---|---|
| Needs | a Google account with 2-step verification | a Brevo account and a verified sender |
| From address | the Gmail address | a verified address (a custom domain is optional) |
| Free limit (to re-check when applying) | about 500 messages per rolling day for personal Gmail, from third-party sources | about 300 per day on the Free plan, from Brevo's pricing, not confirmed in this change |
| Setup effort | lowest | a few more steps |
| Fit | simplest for the demo | closer to production |

Recommendation: start with **Brevo** if the owner has a verified sender, otherwise Gmail, and document both. Either is far above what the demo needs: every Upwork visitor can use "Try the demo" with no email at all.

The committed `supabase/config.toml` gets an `[auth.email.smtp]` block whose `host`, `port`, `user`, `pass`, `admin_email`, and `sender_name` come from `env(...)` references. The values for the **local** stack are not set, so local development keeps using Mailpit (D9). For the **cloud** project, the owner exports the variables in their shell (never in a file under Git) and runs `npx supabase config push --remote`, which applies the auth block, including SMTP, to the cloud project. This keeps "the cloud project is never edited by hand in the dashboard" true. If `config push` cannot carry the SMTP password in the installed CLI version (3.2.0), the fallback is the dashboard's SMTP form, once, noted in the guide. This is verified at apply time (see Open Questions).

The guide lives in `docs/auth-email-setup.md` and records the limits with the date they were checked.

### D8. The component gallery stays outside the guard

`app/dev/gallery.tsx` is a development tool. It is registered as an ordinary, unguarded screen so a developer can reach it signed out. Its existing behavior (redirect home in production) is unchanged: a signed-out production visitor ends up on Welcome through the guard.

### D9. Local development and testing

- **Local sign-in** needs no SMTP: the local stack delivers to Mailpit (`http://127.0.0.1:54424`), where the 6-digit code can be read. The README/guide says so.
- **Jest** tests mock the `api.ts` layer for the screens, and test `errors.ts`, `useResendTimer` (with fake timers and a mocked clock), `AuthProvider` (fake client emitting events), and `session-storage` (MMKV's in-memory mock plus a mocked `expo-secure-store`). The route guard is tested in `__tests__/app/` with a mocked auth state. `expo-secure-store` is mocked in `jest.setup.ts`.
- **API check** (`npm run db:smoke`) gets one new step: request an OTP for a throwaway address against the local stack, read the code from Mailpit's API, verify it, and confirm that the `profiles` row exists. This covers the part Jest cannot: the real server behavior behind D5 and D6.
- **Manual:** one real sign-in on a device against the cloud project, with an address outside the organization.

### D10. New dependency

| Dependency | Why | Free tier |
|---|---|---|
| `expo-secure-store` (SDK 58, `~58.0.3`) | Keeps the encryption key in Keychain / Keystore | Part of the Expo SDK, free, no account |
| `expo-crypto` (SDK 58, `~58.0.8`) | `getRandomBytes` makes the 32-byte key. The app has no other secure random source, and `Math.random` must not make a key. Found while applying task 1.3 | Part of the Expo SDK, free, no account |

Both are native modules, so the development build must be rebuilt (`npx expo prebuild --platform android` then `npm run android`), as STRUCTURE.md already describes for native changes. No other dependency is added: Zod and `supabase-js` are already installed.

## Risks / Trade-offs

- **One shared error for wrong and expired codes** → the app uses its own clock plus a test that keeps the two lifetimes equal. If Supabase later returns distinct codes, `errors.ts` is the one place to change. The API check also asserts today's behavior, so a change shows up in CI.
- **Code guessing.** A 6-digit code has a million values. Supabase limits verification to 30 requests per 5 minutes per IP, codes live 10 minutes, and a new code invalidates the old one. That is acceptable for a journal demo; if the app handles more sensitive data later, the fix is a shorter life, a per-address attempt counter, or CAPTCHA, not part of this change.
- **Email deliverability.** Gmail and Brevo mail can land in spam, especially from a Gmail sender or an unverified domain. → The screen says "Check your spam folder" under the sent-to address, and the resend button is available after 60 seconds.
- **Free provider limits.** A burst (for example, a client demo day) can reach the daily limit, after which no new codes go out. → The generic "could not send" message, and the demo button (next change) removes email from the main demo path. The limit is documented with its check date.
- **Gmail app password is tied to a personal account.** → Brevo is preferred when possible, and the guide says to use a dedicated Google account for the app password.
- **Key lost on device restore.** The user is signed out and signs in again. → Intended (D1).
- **The temporary "Sign out" button is throwaway UI.** → It is one small component on a placeholder screen, and `add-settings-account` removes it. Deleting it is a task there, noted in this change's tasks.
- **Deviation from STRUCTURE.md (D2).** → Recorded in STRUCTURE.md in this change, so the rule and the code agree.
- **`Stack.Protected` is newer API.** → The route test and the manual check at apply time cover the first-route and back-stack behavior; the fallback is a guarded redirect in the root layout.

## Migration Plan

1. Merge the branch (app code, `config.toml`, templates, docs, API check). No SQL migration, so `database.yml` runs only because `supabase/**` changes, and it must stay green.
2. Rebuild the development build (a new native module).
3. Cloud project (owner, once): create the SMTP account, export the variables, run `npx supabase config push --remote`, then sign in once with an outside address.
4. Rollback: revert the merge. Signed-in users on devices lose nothing server-side; the encrypted store is simply unused. The cloud auth settings can be reverted by pushing the previous `config.toml`.

## Open Questions

- Can `supabase config push --remote` (CLI 3.2.0) apply the SMTP password from an environment variable? If not, the SMTP form is filled in once in the dashboard. This changes only the guide, not the code or specs.
- Which provider the owner chooses (Brevo or Gmail). Both are documented; the choice affects only the cloud secrets.
- Exact Brevo and Gmail daily limits on the day of apply. They are recorded in `docs/auth-email-setup.md` with the date.

## Free-tier facts to verify against official pages (at apply time)

- Supabase Free: custom SMTP allowed, default 30 emails per hour with custom SMTP, 60-second per-user OTP interval, 30 `/otp` and `/verify` requests per 5 minutes per IP (https://supabase.com/docs/guides/auth/rate-limits, checked 2026-11-18).
- Supabase built-in email: 2 per hour, organization members only (https://supabase.com/docs/guides/auth/auth-smtp, checked 2026-11-18).
- Brevo Free plan: daily email limit and SMTP relay availability (not confirmed in this change).
- Gmail personal accounts: roughly 500 messages per rolling 24 hours over SMTP, app password requires 2-step verification (third-party sources only, not confirmed against Google's page).
- `expo-secure-store` version for Expo SDK 58 and its synchronous `getItem` (npm lists `58.0.3` as `latest`).
