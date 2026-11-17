// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

// ESLint does not merge the options of one rule across config blocks: a later block replaces
// them. Every block that sets `no-restricted-imports` therefore repeats this pattern.
const featureImportPattern = {
  group: ['@/features/*/*'],
  message: 'Import a feature only through its index.ts (for example @/features/auth).',
};

const mmkvPath = {
  name: 'react-native-mmkv',
  message: 'Import MMKV only inside src/lib/mmkv.ts; use its kvStorage adapter.',
};

const bottomSheetPath = {
  name: '@gorhom/bottom-sheet',
  message: 'Use the BottomSheet component from @/ui. The library is imported only inside src/ui.',
};

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
      'no-restricted-imports': ['error', { patterns: [featureImportPattern] }],
    },
  },
  {
    // STRUCTURE.md: libraries stay behind one adapter. MMKV is imported only in src/lib/mmkv.ts,
    // and the bottom-sheet library only inside src/ui.
    files: ['app/**/*.{js,jsx,ts,tsx}', 'src/**/*.{js,jsx,ts,tsx}'],
    ignores: ['src/lib/mmkv.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [mmkvPath, bottomSheetPath],
          patterns: [featureImportPattern],
        },
      ],
    },
  },
  {
    // STRUCTURE.md: src/ui is pure UI. It holds no business logic, so it never imports feature code.
    files: ['src/ui/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [mmkvPath],
          patterns: [
            featureImportPattern,
            {
              group: ['@/features', '@/features/*'],
              message: 'src/ui holds base components only: it must not import feature code.',
            },
          ],
        },
      ],
    },
  },
]);
