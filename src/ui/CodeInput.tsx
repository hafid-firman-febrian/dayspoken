import { useState } from 'react';
import { Text as NativeText, TextInput, View } from 'react-native';

import { FieldMessage } from './FieldMessage';

export type CodeInputProps = {
  /** The field's name for screen readers, for example "Verification code". */
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Called once each time the code reaches its full length. */
  onComplete?: (code: string) => void;
  /** Number of digits. Default 6. */
  length?: number;
  /** Shown under the cells with an alert icon, and announced. The cells get the error outline. */
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};

const DEFAULT_LENGTH = 6;

/** Keeps digits only, and cuts to the code length. Pasted text may hold spaces or letters. */
function sanitize(text: string, length: number): string {
  return text.replace(/\D/g, '').slice(0, length);
}

// Tailwind only generates classes it can read in the source: keep these literal.
// The outline is always 2pt, so moving between cells never shifts the layout.
const CELL_BASE = 'h-14 flex-1 items-center justify-center rounded-2xl border-2 bg-surface';

/**
 * A numeric code (like the email sign-in code) shown as one cell per digit. One invisible
 * input sits over the cells and does the real work: typing, pasting, and the system's
 * one-time-code autofill. Screen readers see that one input, not the cells.
 */
export function CodeInput({
  label,
  value,
  onChangeText,
  onComplete,
  length = DEFAULT_LENGTH,
  error,
  disabled = false,
  autoFocus = false,
}: CodeInputProps) {
  const [focused, setFocused] = useState(false);

  const handleChangeText = (text: string) => {
    const next = sanitize(text, length);
    onChangeText(next);
    // Once per completed code: re-sending the same full code does not call it again.
    if (next.length === length && next !== value) {
      onComplete?.(next);
    }
  };

  const activeIndex = Math.min(value.length, length - 1);
  const cellOutline = (index: number) =>
    error || (focused && index === activeIndex) ? 'border-accent' : 'border-border';

  return (
    <View testID="code-input" className={['gap-2', disabled ? 'opacity-50' : ''].join(' ').trim()}>
      <View className="relative">
        <View aria-hidden className="flex-row gap-2">
          {Array.from({ length }, (_, index) => (
            <View
              key={index}
              testID={`code-cell-${index}`}
              className={`${CELL_BASE} ${cellOutline(index)}`}
            >
              <NativeText className="font-geist-semibold text-title text-foreground">
                {value[index] ?? ''}
              </NativeText>
            </View>
          ))}
        </View>
        <TextInput
          testID="code-input-field"
          // Sits over the cells and takes every touch, so a tap anywhere focuses it.
          className="absolute inset-0 opacity-0"
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!disabled}
          autoFocus={autoFocus}
          caretHidden
          keyboardType="number-pad"
          inputMode="numeric"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          // No maxLength: a longer paste must reach sanitize() before it is cut.
          accessibilityLabel={label}
          accessibilityValue={{ text: value ? value.split('').join(' ') : 'empty' }}
          accessibilityState={{ disabled }}
        />
      </View>
      <FieldMessage error={error} testID="code-input-message" />
    </View>
  );
}
