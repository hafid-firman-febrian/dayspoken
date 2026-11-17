import type { Config } from 'tailwindcss';

import { tailwindTheme } from './src/theme/tailwind-theme';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  presets: [require('nativewind/preset')],
  theme: {
    extend: tailwindTheme,
  },
  plugins: [],
};

export default config;
