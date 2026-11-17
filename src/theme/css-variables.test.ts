import { cssVariables, hexToChannels } from './css-variables';
import { colors } from './tokens';

describe('hexToChannels', () => {
  it('turns a hex color into space-separated channels', () => {
    expect(hexToChannels('#F8F6F5')).toBe('248 246 245');
    expect(hexToChannels('#000000')).toBe('0 0 0');
  });

  it('rejects anything that is not a 6-digit hex color', () => {
    expect(() => hexToChannels('rgb(0,0,0)')).toThrow(/hex/i);
    expect(() => hexToChannels('#FFF')).toThrow(/hex/i);
  });
});

describe('cssVariables', () => {
  it('maps light tokens to channel values', () => {
    const light = cssVariables('light');
    expect(light['--color-background']).toBe('248 246 245');
    expect(light['--color-surface']).toBe('255 255 255');
    expect(light['--color-on-primary']).toBe('255 255 255');
  });

  it('maps dark tokens to channel values', () => {
    const dark = cssVariables('dark');
    expect(dark['--color-background']).toBe('16 10 9');
    expect(dark['--color-accent']).toBe('251 138 110');
  });

  it('passes scrim through as a whole color, because it has its own alpha', () => {
    expect(cssVariables('light')['--color-scrim']).toBe('rgba(26, 18, 16, 0.4)');
    expect(cssVariables('dark')['--color-scrim']).toBe('rgba(0, 0, 0, 0.6)');
  });

  it.each(['light', 'dark'] as const)('has one variable for every token in %s mode', (scheme) => {
    const expected = Object.keys(colors[scheme]).map((name) => `--color-${name}`);
    expect(Object.keys(cssVariables(scheme)).sort()).toEqual(expected.sort());
  });
});
