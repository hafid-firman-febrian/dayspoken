import { tailwindTheme } from './tailwind-theme';
import { colors, moodColors } from './tokens';

describe('tailwindTheme', () => {
  it('has a color class for every semantic token', () => {
    for (const name of Object.keys(colors.light)) {
      expect(tailwindTheme.colors).toHaveProperty([name]);
    }
  });

  it('reads semantic colors from CSS variables with alpha support', () => {
    expect(tailwindTheme.colors.background).toBe('rgb(var(--color-background) / <alpha-value>)');
    expect(tailwindTheme.colors['on-primary']).toBe('rgb(var(--color-on-primary) / <alpha-value>)');
  });

  it('reads scrim as a whole color, because its alpha differs per mode', () => {
    expect(tailwindTheme.colors.scrim).toBe('var(--color-scrim)');
  });

  it('exposes the mood colors for bg-mood-1 to bg-mood-5', () => {
    for (const [name, value] of Object.entries(moodColors)) {
      expect(tailwindTheme.colors).toHaveProperty([name], value);
    }
  });

  it('exposes the Record palette', () => {
    expect(tailwindTheme.colors.record).toEqual({
      background: '#100A09',
      finish: '#E8573C',
      progress: '#FB8A6E',
    });
  });

  it('exposes one font family per Geist weight', () => {
    expect(tailwindTheme.fontFamily).toEqual({
      geist: ['Geist_400Regular'],
      'geist-medium': ['Geist_500Medium'],
      'geist-semibold': ['Geist_600SemiBold'],
      'geist-bold': ['Geist_700Bold'],
    });
  });

  it('exposes a font size with line height and letter spacing for every type style', () => {
    expect(Object.keys(tailwindTheme.fontSize).sort()).toEqual(
      ['body', 'caption', 'caption-sm', 'display', 'heading', 'reading', 'title'].sort(),
    );
    expect(tailwindTheme.fontSize.display).toEqual([
      '38px',
      { lineHeight: '42px', letterSpacing: '-1px' },
    ]);
    expect(tailwindTheme.fontSize.reading[1].lineHeight).toBe('27px');
  });

  it('exposes the radii and the screen gutter', () => {
    expect(tailwindTheme.borderRadius).toEqual({ card: '22px', hero: '30px' });
    expect(tailwindTheme.spacing).toEqual({ gutter: '20px' });
  });
});
