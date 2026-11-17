import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { typography, type TypeStyle } from '@/theme';

import { useDefaultTextTone, type TextTone } from './text-tone-context';

export type TextVariant = TypeStyle;

// Tailwind only generates classes it can read in the source, so these maps spell every class
// out. Do not build class names from variables.
const VARIANT_CLASS: Record<TextVariant, string> = {
  display: 'font-geist-bold text-display',
  title: 'font-geist-semibold text-title',
  heading: 'font-geist-semibold text-heading',
  body: 'font-geist text-body',
  reading: 'font-geist text-reading',
  caption: 'font-geist-medium text-caption',
  'caption-sm': 'font-geist-medium text-caption-sm',
};

const TONE_CLASS: Record<TextTone, string> = {
  foreground: 'text-foreground',
  muted: 'text-muted',
  accent: 'text-accent',
  'on-primary': 'text-on-primary',
};

const HEADER_VARIANTS: readonly TextVariant[] = ['display', 'title', 'heading'];

export type TextProps = NativeTextProps & {
  variant?: TextVariant;
  /** Default: `foreground`, or `on-primary` inside a hero Card. */
  tone?: TextTone;
  className?: string;
};

export function Text({
  variant = 'body',
  tone,
  className,
  accessibilityRole,
  maxFontSizeMultiplier,
  ...rest
}: TextProps) {
  const defaultTone = useDefaultTextTone();
  const classes = [VARIANT_CLASS[variant], TONE_CLASS[tone ?? defaultTone], className]
    .filter(Boolean)
    .join(' ');

  return (
    <NativeText
      {...rest}
      className={classes}
      accessibilityRole={
        accessibilityRole ?? (HEADER_VARIANTS.includes(variant) ? 'header' : undefined)
      }
      // Large headlines are capped so big system fonts do not break layouts. Body text scales fully.
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? typography[variant].maxFontSizeMultiplier}
    />
  );
}
