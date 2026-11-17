// Single source of truth for the design tokens (STRUCTURE.md, Styling and theming).
// Pure data: no React Native imports, so Node can load it from tailwind.config.ts.
// This is the only place hex colors may appear.

export type SemanticColors = {
  background: string;
  surface: string;
};

export const colors: { light: SemanticColors; dark: SemanticColors } = {
  light: {
    background: '#F8F6F5',
    surface: '#FFFFFF',
  },
  dark: {
    background: '#100A09',
    surface: '#1B1312',
  },
};
