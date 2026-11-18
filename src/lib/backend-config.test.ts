// Checks of backend files that the app relies on but Jest cannot import: the email template and
// supabase/config.toml. They are read from disk, so an edit to one that breaks the app's
// assumptions fails here, not on a user's phone.

import { OTP_LENGTH, OTP_LIFETIME_SECONDS, RESEND_SECONDS } from '@/features/auth';

const { readFileSync } = jest.requireActual('node:fs') as {
  readFileSync: (path: string, encoding: 'utf8') => string;
};

// Jest runs from the repository root.
const readRepoFile = (path: string): string => readFileSync(`${process.cwd()}/${path}`, 'utf8');

describe('supabase/templates/otp.html', () => {
  const template = readRepoFile('supabase/templates/otp.html');

  it('shows the code', () => {
    expect(template).toContain('{{ .Token }}');
  });

  it('has no sign-in or confirmation link, so a code is the only way in', () => {
    expect(template).not.toContain('{{ .ConfirmationURL }}');
    expect(template).not.toContain('{{ .SiteURL }}');
    expect(template).not.toMatch(/<a[\s>]/i);
    expect(template).not.toMatch(/href\s*=/i);
  });

  it('tells the reader how long the code lasts, and that it can be ignored', () => {
    expect(template).toContain('10 minutes');
    expect(template).toMatch(/did not ask for this code/i);
  });

  it('uses inline styles only, because mail clients ignore style sheets and variables', () => {
    expect(template).not.toMatch(/<style[\s>]/i);
    expect(template).not.toMatch(/var\(--/);
  });
});

describe('supabase/config.toml and the auth feature agree', () => {
  const config = readRepoFile('supabase/config.toml');
  // The value of a setting on its own line (not a comment), for example `otp_expiry = 600`.
  const setting = (name: string): string | undefined =>
    new RegExp(`^${name}\\s*=\\s*(.+?)\\s*$`, 'm').exec(config)?.[1];

  it('keeps the code lifetime the app assumes equal to otp_expiry', () => {
    expect(Number(setting('otp_expiry'))).toBe(OTP_LIFETIME_SECONDS);
  });

  it('keeps the code length equal to otp_length', () => {
    expect(Number(setting('otp_length'))).toBe(OTP_LENGTH);
  });

  it('keeps the resend interval equal to max_frequency', () => {
    // Written as "1m0s" in the file: minutes and seconds.
    const match = /^"(?:(\d+)m)?(?:(\d+)s)?"$/.exec(setting('max_frequency') ?? '');
    expect(match).not.toBeNull();
    expect(Number(match?.[1] ?? 0) * 60 + Number(match?.[2] ?? 0)).toBe(RESEND_SECONDS);
  });

  it('says the same lifetime in the email, in minutes', () => {
    const template = readRepoFile('supabase/templates/otp.html');
    expect(template).toContain(`${OTP_LIFETIME_SECONDS / 60} minutes`);
  });

  it('sends the code-only email for both new and existing addresses', () => {
    for (const section of ['magic_link', 'confirmation']) {
      const block = new RegExp(`\\[auth\\.email\\.template\\.${section}\\]([^\\[]*)`).exec(
        config,
      )?.[1];
      expect(block).toContain('content_path = "./supabase/templates/otp.html"');
    }
  });

  it('keeps the SMTP credentials out of the file: only variable names, and the block is off', () => {
    const smtp = config
      .split('\n')
      .filter((line) => /^\s*#?\s*(host|user|pass|admin_email)\s*=\s*"env\(SMTP_/.test(line));
    expect(smtp.length).toBe(4);
    // Nothing is switched on in the committed file: the local stack keeps using its test mailbox.
    expect(config).not.toMatch(/^\[auth\.email\.smtp\]/m);
  });
});
