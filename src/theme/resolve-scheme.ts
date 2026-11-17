import type { ColorSchemeName } from 'react-native';

import type { ColorScheme } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

/** The scheme to render: a manual mode wins, `system` follows the device (light if unknown). */
export function resolveScheme(
  mode: ThemeMode,
  device: ColorSchemeName | null | undefined,
): ColorScheme {
  if (mode === 'system') {
    return device === 'dark' ? 'dark' : 'light';
  }
  return mode;
}
