import type { Config } from 'tailwindcss';

import { colors } from './src/theme/tokens';

// Every color is a CSS variable holding "R G B" channels, set per mode by the
// ThemeProvider. The names come from the token source, so a new token gets a class.
const semanticColors = Object.fromEntries(
  Object.keys(colors.light).map((name) => [name, `rgb(var(--color-${name}) / <alpha-value>)`]),
);

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: semanticColors,
    },
  },
  plugins: [],
};

export default config;
