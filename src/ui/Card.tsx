import type { ReactNode } from 'react';
import { Pressable, View, type ViewProps } from 'react-native';

import { TextToneContext } from './text-tone-context';

export type CardProps = Omit<ViewProps, 'children'> & {
  children?: ReactNode;
  /** `hero` is the primary-colored card (the Today card). Default `default`. */
  variant?: 'default' | 'hero';
  /** Makes the whole card one button. */
  onPress?: () => void;
  className?: string;
};

// Tailwind only generates classes it can read in the source: keep these literal.
const VARIANT_CLASS = {
  default: 'bg-surface rounded-card p-5',
  hero: 'bg-primary rounded-hero p-5',
} as const;

export function Card({ children, variant = 'default', onPress, className, ...rest }: CardProps) {
  const classes = [VARIANT_CLASS[variant], className].filter(Boolean).join(' ');
  // Text inside a hero card is white without each Text asking for it. A default card resets
  // the tone, so a default card nested in a hero card does not inherit white text.
  const content = (
    <TextToneContext.Provider value={variant === 'hero' ? 'on-primary' : 'foreground'}>
      {children}
    </TextToneContext.Provider>
  );

  if (onPress) {
    return (
      <Pressable
        {...rest}
        accessibilityRole="button"
        onPress={onPress}
        className={classes}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View {...rest} className={classes}>
      {content}
    </View>
  );
}
