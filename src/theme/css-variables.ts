import { colors, type ColorScheme } from './tokens';

export type CssVariables = Record<`--color-${string}`, string>;

/** '#F8F6F5' -> '248 246 245', the channel format Tailwind's `<alpha-value>` expects. */
export function hexToChannels(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(`Expected a 6-digit hex color like #1A1210, received "${hex}"`);
  }
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  return channels.join(' ');
}

/**
 * The CSS variables that carry the semantic colors of one mode. `scrim` already has
 * its own alpha, so it is passed through as a whole color instead of as channels.
 */
export function cssVariables(scheme: ColorScheme): CssVariables {
  const variables: CssVariables = {};
  for (const [name, value] of Object.entries(colors[scheme])) {
    variables[`--color-${name}`] = name === 'scrim' ? value : hexToChannels(value);
  }
  return variables;
}
