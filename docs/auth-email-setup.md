# Sign-in email setup (free SMTP)

Dayspoken signs users in with a six digit code sent by email. This guide gets the **cloud** Supabase project sending those emails. The local stack needs none of this: it delivers to its test mailbox.

## Why the built-in email is not enough

Supabase's built-in email service is for testing only:

- It sends **2 messages per hour** for the whole project.
- It sends **only to members of the project's organization**. Any other address fails with "Email address not authorized".
- It has no delivery guarantee.

So a real visitor (for example an Upwork client) would never get a code. A custom SMTP service fixes all three. Supabase Free allows custom SMTP at no cost, and the project limit goes from 2 to **30 messages per hour** (adjustable).

## Local development: no SMTP needed

`npm run db:start` also starts a test mailbox called **Mailpit**: open <http://127.0.0.1:54424>. When you ask for a code in the app (or with `curl`), the email appears there with its six digits. Nothing leaves your computer.

## Pick a provider

| | Gmail app password | Brevo (free plan) |
|---|---|---|
| You need | a Google account with 2-Step Verification | a Brevo account, a verified sender address |
| Emails come from | the Gmail address | the sender address you verified |
| Free limit | about 500 a day for a personal account (see "Limits") | 300 a day (see "Limits") |
| Effort | lowest | a few more steps, and Brevo may need to approve the account first |
| Use it for | the simplest demo | closer to production |

Either one is far more than a portfolio demo needs, and "Try the demo" will let visitors skip email completely. Use a **dedicated** Google account for an app password, not your personal one.

### Gmail

1. Sign in to the Google account. Turn on **2-Step Verification** (Google Account, Security).
2. Create an **App password** (Google Account, Security, 2-Step Verification, App passwords). Name it "Dayspoken". Google shows a 16-character password **once**: copy it now.
3. Settings you will use:
   - host `smtp.gmail.com`, port `587`
   - user: the full Gmail address
   - password: the 16-character app password (no spaces)
   - from address: the same Gmail address

### Brevo

1. Create a free account at brevo.com. A free plan is created automatically. Sending starts once Brevo approves the account.
2. In **Senders, domains and IPs**, add and verify the address the emails will come from.
3. In **SMTP and API**, open the **SMTP** tab and create an **SMTP key**. Brevo may ask you to request SMTP activation from its support first.
4. Settings you will use:
   - host `smtp-relay.brevo.com`, port `587`
   - user: the SMTP login shown on that page
   - password: the SMTP key
   - from address: the verified sender

## Set it up in the cloud project (owner steps, in the dashboard)

The SMTP password is a secret. It must never be in a file under Git, a workflow, or a chat. Type it only in the Supabase dashboard, which stores it encrypted.

**Why the dashboard and not `supabase config push`.** `config push` sends **every** auth property that `supabase/config.toml` declares, and it cannot send only some of them. A `config diff` against the real cloud project (2026-11-18) showed 22 differences. Most had nothing to do with sign-in, and one was a security downgrade: the cloud has email confirmation **on** (`enable_confirmations = true`) while the local file has it off, which is convenient for local development but must not reach production. The same diff showed that a new cloud project sends **8 digit** codes by default, while the app takes 6. So the settings below are set by hand, once. `config.toml` stays the reference for the local stack and for what the cloud should hold.

Open the project in the Supabase dashboard, then Authentication.

1. **SMTP.** Open Emails, then SMTP Settings. Turn on **Enable custom SMTP** and fill in:

   | Field | Gmail | Brevo |
   |---|---|---|
   | Sender email address | the Gmail address | the verified sender |
   | Sender name | `Dayspoken` | `Dayspoken` |
   | Host | `smtp.gmail.com` | `smtp-relay.brevo.com` |
   | Port number | `465` | `587` |
   | Username | the full Gmail address | the SMTP login |
   | Password | the 16 character app password, no spaces | the SMTP key |

   Save. The password is hidden afterwards ("Stored password is hidden"). To change it, type a new one. The dashboard shows a yellow note that Gmail is meant for personal email: that is only a warning about deliverability.
2. **Code length and lifetime.** Open Sign In / Providers, then Email. Set **Email OTP Length** to `6` and **Email OTP Expiration** to `600` (seconds). Save.
3. **Email templates.** Open Emails, then Templates. Do the same for **Confirm sign up** and **Magic link**: set the subject to `Your Dayspoken code`, and replace the message body with the contents of `supabase/templates/otp.html` (on a Mac: `pbcopy < supabase/templates/otp.html`, then paste). The body must hold `{{ .Token }}` and no `{{ .ConfirmationURL }}`. Both templates need it: the cloud project has email confirmation on, so a **new** address gets the Confirm sign up email and an **existing** one gets the Magic link email.
4. **Leave email confirmation on** (Sign In / Providers, Email, Confirm email). Do not copy the local `false` to the cloud.

## Test with a real address

1. Run the app against the cloud project (`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env`, see `.env.example`).
2. Sign in with an address that is **not** a member of your Supabase organization.
3. The email "Your Dayspoken code" should arrive within a minute. Check spam too: mail from a free Gmail sender or an unverified address can land there.
4. Enter the code. You should be signed in.

If the email never arrives: look at Authentication, Logs in the dashboard, and see "Troubleshooting".

## What the project configures for sign-in

For the local stack this lives in `supabase/config.toml` and the email in `supabase/templates/otp.html`. The cloud project holds the same values, set by hand in the dashboard (see above):

| Setting | Value | Why |
|---|---|---|
| `otp_length` | 6 | the app's code input has six cells |
| `otp_expiry` | 600 s (10 minutes) | short life is safer. The app mirrors it as `OTP_LIFETIME_SECONDS`, and a test keeps both equal |
| `max_frequency` | 1 minute | one new code per address per minute, also the app's resend timer |
| `[auth.rate_limit] email_sent` | 30 per hour | the Supabase Free default with custom SMTP, written down so it is visible |
| Email template | code only, no link | the same email for a new address (Confirm signup) and an existing one (Magic Link) |

## Limits

Checked on **2026-11-18**. Re-check them before relying on a number.

| Limit | Value | Source |
|---|---|---|
| Built-in Supabase email | 2 per hour, organization members only | <https://supabase.com/docs/guides/auth/auth-smtp> |
| Emails with custom SMTP | 30 per hour by default, adjustable | <https://supabase.com/docs/guides/auth/auth-smtp> |
| New code for one address | once every 60 seconds | <https://supabase.com/docs/guides/auth/rate-limits> |
| Code requests and code checks | 30 requests per 5 minutes per IP address | <https://supabase.com/docs/guides/auth/rate-limits> |
| Gmail, Google Workspace account | 2,000 messages per day, 100 recipients per message over SMTP (page updated 2026-11-10) | <https://knowledge.workspace.google.com/admin/gmail/gmail-sending-limits-in-google-workspace> |
| Gmail, personal account | about 500 messages per rolling 24 hours. **Not confirmed on a Google page**: only third-party sources say so | none official found |
| Brevo free plan | 300 emails per day, after Brevo approves the account. Taken from Brevo's own marketing pages, **not from its help center** | <https://www.brevo.com/pricing/> |

When a provider limit is reached, the app shows "We could not send the code. Try again." and no new codes go out until the limit resets.

## Troubleshooting

| What you see | Likely cause |
|---|---|
| "Email address not authorized" in the logs | custom SMTP is not on, so the built-in service is still sending (organization members only) |
| `535` or "authentication failed" | wrong user or password. For Gmail, the app password must be the 16 characters without spaces |
| `550 5.4.5 Daily sending quota exceeded` (Gmail) | the daily limit is used up. Sending resumes after up to 24 hours |
| Code requested, no email, no error | check spam. Then check Authentication, Logs |
| "Too many codes requested" in the app | the 60 second limit per address, or the hourly project limit, was hit. Wait and retry |
