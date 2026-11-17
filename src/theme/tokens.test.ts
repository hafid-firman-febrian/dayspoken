import { contrastRatio } from './contrast';
import { MOOD_LEVELS, MOOD_SCALE } from './mood';
import {
  colors,
  moodColors,
  radius,
  recordPalette,
  spacing,
  typography,
  type ColorScheme,
} from './tokens';

const SCHEMES: ColorScheme[] = ['light', 'dark'];

describe('semantic colors', () => {
  it('has the Tomato light values', () => {
    expect(colors.light).toEqual({
      background: '#F8F6F5',
      surface: '#FFFFFF',
      foreground: '#1A1210',
      muted: '#6E6460',
      border: '#ECE6E3',
      primary: '#CC3F27',
      'on-primary': '#FFFFFF',
      accent: '#CC3F27',
      fab: '#CC3F27',
      'on-fab': '#FFFFFF',
      scrim: 'rgba(26, 18, 16, 0.4)',
    });
  });

  it('has the Tomato dark values', () => {
    expect(colors.dark).toEqual({
      background: '#100A09',
      surface: '#1B1312',
      foreground: '#FBF3F1',
      muted: '#B09E99',
      border: '#2D2120',
      primary: '#CC3F27',
      'on-primary': '#FFFFFF',
      accent: '#FB8A6E',
      fab: '#E8573C',
      'on-fab': '#1A0603',
      scrim: 'rgba(0, 0, 0, 0.6)',
    });
  });

  it('defines the same tokens in both modes', () => {
    expect(Object.keys(colors.dark).sort()).toEqual(Object.keys(colors.light).sort());
  });
});

describe('mood scale', () => {
  it('has five levels with fixed labels and colors', () => {
    expect(MOOD_LEVELS).toEqual([1, 2, 3, 4, 5]);
    expect(MOOD_SCALE[1]).toEqual({ label: 'Rough', colorToken: 'mood-1' });
    expect(MOOD_SCALE[2]).toEqual({ label: 'Low', colorToken: 'mood-2' });
    expect(MOOD_SCALE[3]).toEqual({ label: 'Okay', colorToken: 'mood-3' });
    expect(MOOD_SCALE[4]).toEqual({ label: 'Good', colorToken: 'mood-4' });
    expect(MOOD_SCALE[5]).toEqual({ label: 'Great', colorToken: 'mood-5' });
  });

  it('has the agreed colors', () => {
    expect(moodColors).toEqual({
      'mood-1': '#6366F1',
      'mood-2': '#0EA5E9',
      'mood-3': '#A8A29E',
      'mood-4': '#10B981',
      'mood-5': '#FBBF24',
    });
  });

  it('points every level at an existing color token', () => {
    for (const level of MOOD_LEVELS) {
      expect(moodColors).toHaveProperty(MOOD_SCALE[level].colorToken);
    }
  });

  it('keeps mood colors out of the mode-dependent tokens, so they are the same in both modes', () => {
    for (const scheme of SCHEMES) {
      expect(Object.keys(colors[scheme]).filter((name) => name.startsWith('mood'))).toEqual([]);
    }
  });
});

describe('record palette', () => {
  it('has the agreed values', () => {
    expect(recordPalette.background).toBe('#100A09');
    expect(recordPalette.finish).toBe('#E8573C');
    expect(recordPalette.finishIcon).toBe('#FFFFFF');
    expect(recordPalette.progress).toBe('#FB8A6E');
  });

  it('orders the VoiceOrb gradient from #FFFFFF to #7A2213', () => {
    expect(recordPalette.orbStops).toEqual(['#FFFFFF', '#FDC8B8', '#E8664C', '#7A2213']);
  });
});

describe('typography, spacing, and radius', () => {
  it('has the agreed type scale', () => {
    expect(typography.display).toMatchObject({ fontSize: 38, fontFamily: 'Geist_700Bold' });
    expect(typography.display.letterSpacing).toBeLessThan(0);
    expect(typography.title).toMatchObject({ fontSize: 27, fontFamily: 'Geist_600SemiBold' });
    expect(typography.heading).toMatchObject({ fontSize: 18, fontFamily: 'Geist_600SemiBold' });
    expect(typography.body).toMatchObject({ fontSize: 16, fontFamily: 'Geist_400Regular' });
    expect(typography.reading).toMatchObject({ fontSize: 17, fontFamily: 'Geist_400Regular' });
    expect(typography.caption).toMatchObject({ fontSize: 13, fontFamily: 'Geist_500Medium' });
    expect(typography['caption-sm']).toMatchObject({ fontSize: 12, fontFamily: 'Geist_500Medium' });
  });

  it('gives reading text a line height of about 1.6', () => {
    expect(typography.reading.lineHeight / typography.reading.fontSize).toBeCloseTo(1.6, 1);
  });

  it('uses the 20pt gutter and the card radii', () => {
    expect(spacing.gutter).toBe(20);
    expect(radius).toEqual({ card: 22, hero: 30 });
  });
});

type Pair = { name: string; foreground: string; background: string; minimum: number };

function textPairs(scheme: ColorScheme): Pair[] {
  const c = colors[scheme];
  return [
    ['foreground', 'background'],
    ['foreground', 'surface'],
    ['muted', 'background'],
    ['muted', 'surface'],
    ['accent', 'background'],
    ['accent', 'surface'],
    ['on-primary', 'primary'],
  ].map(([fg, bg]) => ({
    name: `${scheme}: text ${fg} on ${bg}`,
    foreground: c[fg as keyof typeof c],
    background: c[bg as keyof typeof c],
    minimum: 4.5,
  }));
}

function iconPairs(scheme: ColorScheme): Pair[] {
  const c = colors[scheme];
  return [
    { name: `${scheme}: icon on-fab on fab`, foreground: c['on-fab'], background: c.fab },
    {
      name: `${scheme}: icon on-primary on primary`,
      foreground: c['on-primary'],
      background: c.primary,
    },
    // The mic button on the Today card: a primary icon on a white (on-primary) button.
    {
      name: `${scheme}: icon primary on on-primary`,
      foreground: c.primary,
      background: c['on-primary'],
    },
    {
      name: `${scheme}: icon Finish square on Finish button`,
      foreground: recordPalette.finishIcon,
      background: recordPalette.finish,
    },
  ].map((pair) => ({ ...pair, minimum: 3 }));
}

function failures(pairs: Pair[]): string[] {
  return pairs
    .map((pair) => ({ ...pair, ratio: contrastRatio(pair.foreground, pair.background) }))
    .filter((pair) => pair.ratio < pair.minimum)
    .map((pair) => `${pair.name} is ${pair.ratio.toFixed(2)}:1, needs ${pair.minimum}:1`);
}

describe('contrast', () => {
  it.each(SCHEMES)('every text pair reaches 4.5:1 in %s mode', (scheme) => {
    expect(failures(textPairs(scheme))).toEqual([]);
  });

  it.each(SCHEMES)('every icon-on-fill pair reaches 3:1 in %s mode', (scheme) => {
    expect(failures(iconPairs(scheme))).toEqual([]);
  });

  it('reports the failing pair and its ratio', () => {
    const broken: Pair = {
      name: 'light: text muted on background',
      foreground: '#A8A29E',
      background: colors.light.background,
      minimum: 4.5,
    };
    expect(failures([broken])).toEqual([
      expect.stringMatching(/^light: text muted on background is \d\.\d\d:1, needs 4\.5:1$/),
    ]);
  });
});
