import { fireEvent, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { CodeInput } from './CodeInput';
import { renderWithProviders, SCHEMES } from './test-utils';

type HarnessProps = {
  onComplete?: (code: string) => void;
  length?: number;
  error?: string;
  disabled?: boolean;
};

// CodeInput is controlled, like a form field. The harness holds the value as a screen would.
function Harness({ onComplete, length, error, disabled }: HarnessProps) {
  const [value, setValue] = useState('');
  return (
    <CodeInput
      label="Verification code"
      value={value}
      onChangeText={setValue}
      onComplete={onComplete}
      length={length}
      error={error}
      disabled={disabled}
    />
  );
}

const field = () => screen.getByTestId('code-input-field');
const cell = (index: number) =>
  screen.getByTestId(`code-cell-${index}`, { includeHiddenElements: true });
const cellText = (index: number) => cell(index).props.children?.props?.children ?? '';
const cellClasses = (index: number): string[] => cell(index).props.className.split(' ');

async function type(text: string) {
  await fireEvent.changeText(field(), text);
}

describe.each(SCHEMES)('CodeInput (%s mode)', (scheme) => {
  it('shows six empty cells', async () => {
    await renderWithProviders(<Harness />, { scheme });
    for (let index = 0; index < 6; index += 1) {
      expect(cell(index)).toBeOnTheScreen();
    }
    expect(screen.queryByTestId('code-cell-6', { includeHiddenElements: true })).toBeNull();
  });
});

describe('CodeInput typing', () => {
  it('puts each digit in its own cell', async () => {
    await renderWithProviders(<Harness />);
    await type('1');
    await type('12');
    await type('123');
    expect([0, 1, 2, 3].map(cellText)).toEqual(['1', '2', '3', '']);
  });

  it('calls onComplete once, with the string, when six digits are typed', async () => {
    const onComplete = jest.fn();
    await renderWithProviders(<Harness onComplete={onComplete} />);
    for (const partial of ['1', '12', '123', '1234', '12345']) {
      await type(partial);
    }
    expect(onComplete).not.toHaveBeenCalled();
    await type('123456');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('completes on a pasted code', async () => {
    const onComplete = jest.fn();
    await renderWithProviders(<Harness onComplete={onComplete} />);
    await type('123456');
    expect([0, 1, 2, 3, 4, 5].map(cellText)).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('keeps only the digits of pasted text', async () => {
    const onComplete = jest.fn();
    await renderWithProviders(<Harness onComplete={onComplete} />);
    await type('12a4 56');
    expect(field().props.value).toBe('12456');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('cuts a longer paste to the code length and completes', async () => {
    const onComplete = jest.fn();
    await renderWithProviders(<Harness onComplete={onComplete} />);
    await type('1234567890');
    expect(field().props.value).toBe('123456');
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('does not call onComplete again for the same code', async () => {
    const onComplete = jest.fn();
    await renderWithProviders(<Harness onComplete={onComplete} />);
    await type('123456');
    await type('123456');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete again when the code is changed and completed again', async () => {
    const onComplete = jest.fn();
    await renderWithProviders(<Harness onComplete={onComplete} />);
    await type('123456');
    await type('12345');
    await type('123459');
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenLastCalledWith('123459');
  });

  it('ignores letters and symbols completely', async () => {
    await renderWithProviders(<Harness />);
    await type('abc!');
    expect(field().props.value).toBe('');
  });

  it('supports another length', async () => {
    const onComplete = jest.fn();
    await renderWithProviders(<Harness length={4} onComplete={onComplete} />);
    expect(screen.queryByTestId('code-cell-4', { includeHiddenElements: true })).toBeNull();
    await type('123456');
    expect(field().props.value).toBe('1234');
    expect(onComplete).toHaveBeenCalledWith('1234');
  });
});

describe('CodeInput autofill and keyboard', () => {
  it('opens the number keyboard and accepts a one-time code from the system', async () => {
    await renderWithProviders(<Harness />);
    expect(field().props.keyboardType).toBe('number-pad');
    expect(field().props.textContentType).toBe('oneTimeCode');
    expect(field().props.autoComplete).toBe('one-time-code');
  });

  it('does not cut a paste before it can be cleaned', async () => {
    await renderWithProviders(<Harness />);
    expect(field().props.maxLength).toBeUndefined();
  });
});

describe('CodeInput error and disabled states', () => {
  it('shows the error message and announces it', async () => {
    await renderWithProviders(<Harness error="That code is not right" />);
    expect(screen.getByText('That code is not right')).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent('That code is not right');
  });

  it('uses the error outline on every cell', async () => {
    await renderWithProviders(<Harness error="That code is not right" />);
    for (let index = 0; index < 6; index += 1) {
      expect(cellClasses(index)).toContain('border-accent');
    }
  });

  it('uses the quiet border on the cells when there is no error and no focus', async () => {
    await renderWithProviders(<Harness />);
    for (let index = 0; index < 6; index += 1) {
      expect(cellClasses(index)).toContain('border-border');
    }
  });

  it('highlights the cell to be typed next while focused', async () => {
    await renderWithProviders(<Harness />);
    await fireEvent(field(), 'focus');
    await type('12');
    expect(cellClasses(2)).toContain('border-accent');
    expect(cellClasses(0)).toContain('border-border');
    expect(cellClasses(3)).toContain('border-border');
  });

  it('cannot be edited when disabled', async () => {
    await renderWithProviders(<Harness disabled />);
    expect(field().props.editable).toBe(false);
    expect(field().props.accessibilityState).toMatchObject({ disabled: true });
  });
});

describe('CodeInput accessibility', () => {
  it('is one field with its label, not six', async () => {
    await renderWithProviders(<Harness />);
    expect(screen.getAllByLabelText('Verification code')).toHaveLength(1);
    expect(screen.queryByTestId('code-cell-0')).toBeNull();
  });

  it('announces the digits entered so far', async () => {
    await renderWithProviders(<Harness />);
    await type('123');
    expect(field().props.accessibilityValue).toEqual({ text: '1 2 3' });
  });

  it('announces an empty field as empty', async () => {
    await renderWithProviders(<Harness />);
    expect(field().props.accessibilityValue).toEqual({ text: 'empty' });
  });
});
