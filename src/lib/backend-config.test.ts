// Checks of backend files that the app relies on but Jest cannot import: the email template and
// supabase/config.toml. They are read from disk, so an edit to one that breaks the app's
// assumptions fails here, not on a user's phone.

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
