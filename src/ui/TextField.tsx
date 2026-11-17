import { useState } from 'react';
import {
  Text as NativeText,
  TextInput,
  View,
  type TextInputFocusEvent,
  type TextInputProps,
} from 'react-native';

import { useTheme } from '@/theme';

import { FieldMessage } from './FieldMessage';

export type TextFieldProps = Omit<
  TextInputProps,
  'style' | 'placeholderTextColor' | 'editable' | 'accessibilityLabel'
> & {
  /** Always visible, above the input. It is also the input's name for screen readers. */
  label: string;
  /** Shown under the input with an alert icon, and announced. Replaces `helperText`. */
  error?: string;
  helperText?: string;
  disabled?: boolean;
  /** Extra classes for the whole field. */
  className?: string;
};

// Tailwind only generates classes it can read in the source: keep these literal.
// The outline is always 2pt, so focusing never shifts the layout. Only its color changes.
const INPUT_BASE = 'rounded-2xl border-2 bg-surface px-4 font-geist text-body text-foreground';

export function TextField({
  label,
  error,
  helperText,
  disabled = false,
  multiline = false,
  className,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const handleFocus = (event: TextInputFocusEvent) => {
    setFocused(true);
    onFocus?.(event);
  };
  const handleBlur = (event: TextInputFocusEvent) => {
    setFocused(false);
    onBlur?.(event);
  };

  // The accent outline marks focus and errors. The resting outline is the quiet border token.
  const outline = focused || error ? 'border-accent' : 'border-border';
  const inputClasses = [
    INPUT_BASE,
    outline,
    multiline ? 'min-h-[120px] py-3' : 'h-[52px]',
    disabled ? 'opacity-50' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View className={['gap-1.5', className].filter(Boolean).join(' ')}>
      <NativeText className="font-geist-medium text-caption text-foreground">{label}</NativeText>
      <TextInput
        {...inputProps}
        testID="text-field-input"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        editable={!disabled}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={inputClasses}
      />
      <FieldMessage error={error} helperText={helperText} testID="text-field-message" />
    </View>
  );
}
