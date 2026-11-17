import type { LucideIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Icon, type IconTone } from './Icon';

export type IconButtonVariant = 'plain' | 'surface' | 'primary' | 'fab' | 'inverse';

export type IconButtonProps = {
  icon: LucideIcon;
  /** Required: an icon button has no text, so this is its only name for screen readers. */
  accessibilityLabel: string;
  onPress: () => void;
  /**
   * `fab` is the record button. `inverse` is for use on a hero card: an on-primary fill with
   * a primary icon (the white mic button).
   */
  variant?: IconButtonVariant;
  disabled?: boolean;
  className?: string;
  testID?: string;
};

// Tailwind only generates classes it can read in the source: keep these literal.
// Every size is at least 44pt, the minimum touch target.
const CONTAINER_CLASS: Record<IconButtonVariant, string> = {
  plain: 'h-11 w-11',
  surface: 'h-11 w-11 bg-surface border border-border',
  primary: 'h-11 w-11 bg-primary',
  fab: 'h-14 w-14 bg-fab',
  inverse: 'h-11 w-11 bg-on-primary',
};

const ICON_TONE: Record<IconButtonVariant, IconTone> = {
  plain: 'foreground',
  surface: 'foreground',
  primary: 'on-primary',
  fab: 'on-fab',
  inverse: 'primary',
};

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'plain',
  disabled = false,
  className,
  testID,
}: IconButtonProps) {
  const classes = [
    'items-center justify-center rounded-full',
    CONTAINER_CLASS[variant],
    disabled ? 'opacity-50' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={classes}
      style={({ pressed }) => ({ opacity: pressed && !disabled ? 0.85 : undefined })}
    >
      <Icon icon={icon} tone={ICON_TONE[variant]} size={variant === 'fab' ? 24 : 20} />
    </Pressable>
  );
}
