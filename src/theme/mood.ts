import type { MoodColorToken } from './tokens';

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type MoodInfo = {
  label: string;
  colorToken: MoodColorToken;
};

/**
 * The mood scale. A mood is never shown by color alone: wherever a mood color appears,
 * its label is shown next to it. The label itself uses the foreground or muted token,
 * never a mood color.
 */
export const MOOD_SCALE: Record<MoodLevel, MoodInfo> = {
  1: { label: 'Rough', colorToken: 'mood-1' },
  2: { label: 'Low', colorToken: 'mood-2' },
  3: { label: 'Okay', colorToken: 'mood-3' },
  4: { label: 'Good', colorToken: 'mood-4' },
  5: { label: 'Great', colorToken: 'mood-5' },
};

export const MOOD_LEVELS: readonly MoodLevel[] = [1, 2, 3, 4, 5];
