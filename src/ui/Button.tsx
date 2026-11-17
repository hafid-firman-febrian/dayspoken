import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text as NativeText } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconTone } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'sm';

export type ButtonProps = {
  /** The visible text. A button always has one. */
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** A Lucide icon shown before the label. */
  icon?: LucideIcon;
  /** Shows a spinner in place of the icon, keeps the width, and ignores presses. */
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Overrides the label for screen readers. */
  accessibilityLabel?: string;
  className?: string;
  testID?: string;
};

// Tailwind only generates classes it can read in the source: keep these literal.
const CONTAINER_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface border border-border',
  ghost: '',
};

const LABEL_CLASS: Record<ButtonVariant, string> = {
  primary: 'text-on-primary',
  secondary: 'text-foreground',
  ghost: 'text-accent',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  md: 'h-[52px] px-6',
  sm: 'h-10 px-4',
};

const CONTENT_TONE: Record<ButtonVariant, IconTone> = {
  primary: 'on-primary',
  secondary: 'foreground',
  ghost: 'accent',
};

// A small button is 40pt high. The extra hit area brings the touch target to 44.
const SMALL_HIT_SLOP = { top: 2, bottom: 2, left: 2, right: 2 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
  className,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const tone = CONTENT_TONE[variant];

  const classes = [
    'flex-row items-center justify-center gap-2 rounded-full',
    SIZE_CLASS[size],
    CONTAINER_CLASS[variant],
    fullWidth ? 'w-full' : '',
    disabled ? 'opacity-50' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      hitSlop={size === 'sm' ? SMALL_HIT_SLOP : undefined}
      onPress={onPress}
      className={classes}
      style={({ pressed }) => ({ opacity: pressed && !inactive ? 0.85 : undefined })}
    >
      {loading ? (
        <ActivityIndicator testID="button-loading" size="small" color={colors[tone]} />
      ) : icon ? (
        <Icon icon={icon} tone={tone} size={size === 'sm' ? 16 : 20} />
      ) : null}
      <NativeText className={`font-geist-semibold text-body ${LABEL_CLASS[variant]}`}>
        {label}
      </NativeText>
    </Pressable>
  );
}
