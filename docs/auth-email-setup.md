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

## Send the settings to the cloud project (owner steps)

The SMTP password is a secret. It must never be in a file under Git, a workflow, or a chat. Type it only in your own terminal.

1. **Link the project** (once; skip if you already did it for the database): `npx supabase link --project-ref <project-ref>`. It asks for the database password.
2. **Put the settings in your shell**, not in a file. `read -rs` hides what you type:

   ```bash
   export SMTP_HOST=smtp.gmail.com          # or smtp-relay.brevo.com
   export SMTP_USER=you@example.com         # Gmail address, or the Brevo SMTP login
   export SMTP_FROM_EMAIL=you@example.com   # the address the emails come from
   read -rs SMTP_PASS && export SMTP_PASS   # paste the app password or SMTP key, press Enter
   ```

3. **Turn the SMTP block on** in `supabase/config.toml`: remove the `#` from the `[auth.email.smtp]` block (it reads the four variables above). **Do not commit this change**: the committed file keeps the block commented out so the local stack keeps using Mailpit.
4. **Preview what will change**: `npx supabase config diff`. Read it. `config push` sends **every auth property the file declares**, not only the SMTP ones, including values meant for the local stack (for example `site_url`). Sign-in by code uses no link, so these do not affect users, but you should know. Stop here and ask if the diff shows something you do not expect.
5. **Push**: `npx supabase config push`. It shows the diff again and asks once (the default answer is no). It uses the linked project; `--remote=<ref>` targets another one.
6. **Check the password arrived.** In the Supabase dashboard open Authentication, Emails, SMTP Settings. It should show custom SMTP **enabled** with your host and sender. If the host is there but the password is empty, `config push` did not carry the `env(...)` value: type the password into that form once, in the dashboard. The rest of the settings stay in `config.toml`.
7. **Put the block back to commented** in `supabase/config.toml` (`git restore supabase/config.toml` if that was your only change). Properties a file does not declare are left unchanged, so SMTP stays on in the cloud.

## Test with a real address

1. Run the app against the cloud project (`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env`, see `.env.example`).
2. Sign in with an address that is **not** a member of your Supabase organization.
3. The email "Your Dayspoken code" should arrive within a minute. Check spam too: mail from a free Gmail sender or an unverified address can land there.
4. Enter the code. You should be signed in.

If the email never arrives: look at Authentication, Logs in the dashboard, and see "Troubleshooting".

## What the project configures for sign-in

All of this lives in `supabase/config.toml` and the email in `supabase/templates/otp.html`:

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
