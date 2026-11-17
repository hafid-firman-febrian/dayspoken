// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*', 'coverage/*'],
  },
  {
    // STRUCTURE.md: the app reads configuration only through the env module.
    files: ['app/**/*.{js,jsx,ts,tsx}', 'src/**/*.{js,jsx,ts,tsx}'],
    ignores: ['src/lib/env.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Read environment values only through src/lib/env.ts.',
        },
      ],
    },
  },
  {
    // STRUCTURE.md: components use semantic tokens, never hex colors. Hex values live in
    // src/theme only (the token source).
    files: ['app/**/*.{js,jsx,ts,tsx}', 'src/**/*.{js,jsx,ts,tsx}'],
    ignores: ['src/theme/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
          message:
            'Use a semantic token (bg-surface, text-muted, ...) instead of a hex color. Hex values live in src/theme/tokens.ts.',
        },
      ],
    },
  },
  {
    // STRUCTURE.md: features import each other only through their index.ts.
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message: 'Import a feature only through its index.ts (for example @/features/auth).',
            },
          ],
        },
      ],
    },
  },
]);
