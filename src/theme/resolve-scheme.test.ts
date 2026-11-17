import { resolveScheme } from './resolve-scheme';

describe('resolveScheme', () => {
  it('follows a dark device in system mode', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
  });

  it('follows a light device in system mode', () => {
    expect(resolveScheme('system', 'light')).toBe('light');
  });

  it('falls back to light when the device reports no appearance', () => {
    expect(resolveScheme('system', null)).toBe('light');
    expect(resolveScheme('system', undefined)).toBe('light');
  });

  it('ignores the device in light mode', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
  });

  it('ignores the device in dark mode', () => {
    expect(resolveScheme('dark', 'light')).toBe('dark');
    expect(resolveScheme('dark', null)).toBe('dark');
  });
});
