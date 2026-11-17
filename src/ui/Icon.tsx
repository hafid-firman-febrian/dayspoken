import type { LucideIcon } from 'lucide-react-native';

import { useTheme, type SemanticColors } from '@/theme';

export type IconTone = Exclude<keyof SemanticColors, 'scrim'>;

export type IconProps = {
  /** A Lucide icon component, for example `Mic` from 'lucide-react-native'. */
  icon: LucideIcon;
  size?: number;
  /** A semantic color token. Default `foreground`. */
  tone?: IconTone;
  strokeWidth?: number;
  /**
   * Makes the icon meaningful: a screen reader announces it as an image with this label.
   * Without it the icon is decorative and hidden from screen readers.
   */
  accessibilityLabel?: string;
  testID?: string;
};

export function Icon({
  icon: Glyph,
  size = 20,
  tone = 'foreground',
  strokeWidth = 2,
  accessibilityLabel,
  testID,
}: IconProps) {
  const { colors } = useTheme();

  // Lucide hides an icon from screen readers unless it gets an aria-* prop, role, or title.
  const labelProps = accessibilityLabel
    ? ({ accessible: true, role: 'img', 'aria-label': accessibilityLabel } as const)
    : {};

  return (
    <Glyph
      size={size}
      color={colors[tone]}
      strokeWidth={strokeWidth}
      testID={testID}
      {...labelProps}
    />
  );
}
