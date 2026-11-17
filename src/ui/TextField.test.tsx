import { fireEvent, screen } from '@testing-library/react-native';

import { colors } from '@/theme';

import { TextField } from './TextField';
import { renderWithProviders, SCHEMES } from './test-utils';

const input = () => screen.getByTestId('text-field-input');
const inputClasses = (): string[] => input().props.className.split(' ');

describe.each(SCHEMES)('TextField (%s mode)', (scheme) => {
  it('shows its label above the input', async () => {
    await renderWithProviders(<TextField label="Email" />, { scheme });
    expect(screen.getByText('Email')).toBeOnTheScreen();
  });

  it('colors the placeholder with the muted token', async () => {
    await renderWithProviders(<TextField label="Email" placeholder="you@example.com" />, {
      scheme,
    });
    expect(input().props.placeholderTextColor).toBe(colors[scheme].muted);
  });

  it('colors the selection with the accent token', async () => {
    await renderWithProviders(<TextField label="Email" />, { scheme });
    expect(input().props.selectionColor).toBe(colors[scheme].accent);
  });
});

describe('TextField label and value', () => {
  it('names the input by its label for screen readers', async () => {
    await renderWithProviders(<TextField label="Email" />);
    expect(screen.getByLabelText('Email')).toBe(input());
  });

  it('shows the placeholder', async () => {
    await renderWithProviders(<TextField label="Email" placeholder="you@example.com" />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeOnTheScreen();
  });

  it('shows the value it is given', async () => {
    await renderWithProviders(<TextField label="Email" value="ada@example.com" />);
    expect(input().props.value).toBe('ada@example.com');
  });

  it('reports typed text', async () => {
    const onChangeText = jest.fn();
    await renderWithProviders(<TextField label="Email" onChangeText={onChangeText} />);
    await fireEvent.changeText(input(), 'ada');
    expect(onChangeText).toHaveBeenCalledWith('ada');
  });

  it('passes other input props through', async () => {
    await renderWithProviders(
      <TextField label="Email" keyboardType="email-address" autoCapitalize="none" />,
    );
    expect(input().props.keyboardType).toBe('email-address');
    expect(input().props.autoCapitalize).toBe('none');
  });
});

describe('TextField helper text and errors', () => {
  it('shows helper text in the muted tone', async () => {
    await renderWithProviders(<TextField label="Email" helperText="We never share it" />);
    const helper = screen.getByText('We never share it');
    expect(helper.props.className.split(' ')).toContain('text-muted');
  });

  it('shows the error under the input with an icon', async () => {
    await renderWithProviders(<TextField label="Email" error="Enter a valid email address" />);
    expect(screen.getByText('Enter a valid email address')).toBeOnTheScreen();
    expect(
      screen.getByTestId('text-field-message-icon', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
  });

  it('announces the error to screen readers', async () => {
    await renderWithProviders(<TextField label="Email" error="Enter a valid email address" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address');
    expect(screen.getByTestId('text-field-message').props.accessibilityLiveRegion).toBe('polite');
  });

  it('shows the error instead of the helper text', async () => {
    await renderWithProviders(
      <TextField
        label="Email"
        helperText="We never share it"
        error="Enter a valid email address"
      />,
    );
    expect(screen.queryByText('We never share it')).toBeNull();
    expect(screen.getByText('Enter a valid email address')).toBeOnTheScreen();
  });

  it('shows no message when there is neither', async () => {
    await renderWithProviders(<TextField label="Email" />);
    expect(screen.queryByTestId('text-field-message')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('draws the error text in the accent tone', async () => {
    await renderWithProviders(<TextField label="Email" error="Required" />);
    expect(screen.getByText('Required').props.className.split(' ')).toContain('text-accent');
  });
});

describe('TextField outline', () => {
  it('rests on the quiet border', async () => {
    await renderWithProviders(<TextField label="Email" />);
    expect(inputClasses()).toContain('border-border');
    expect(inputClasses()).not.toContain('border-accent');
  });

  it('turns accent on focus and back on blur', async () => {
    await renderWithProviders(<TextField label="Email" />);
    await fireEvent(input(), 'focus');
    expect(inputClasses()).toContain('border-accent');
    await fireEvent(input(), 'blur');
    expect(inputClasses()).toContain('border-border');
  });

  it('keeps the accent outline while there is an error', async () => {
    await renderWithProviders(<TextField label="Email" error="Required" />);
    expect(inputClasses()).toContain('border-accent');
    await fireEvent(input(), 'blur');
    expect(inputClasses()).toContain('border-accent');
  });

  it('keeps a 2pt outline in every state, so focusing never shifts the layout', async () => {
    await renderWithProviders(<TextField label="Email" />);
    expect(inputClasses()).toContain('border-2');
    await fireEvent(input(), 'focus');
    expect(inputClasses()).toContain('border-2');
  });

  it('still calls the focus and blur handlers it is given', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await renderWithProviders(<TextField label="Email" onFocus={onFocus} onBlur={onBlur} />);
    await fireEvent(input(), 'focus');
    await fireEvent(input(), 'blur');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});

describe('TextField disabled and multiline', () => {
  it('cannot be edited and says it is disabled', async () => {
    await renderWithProviders(<TextField label="Email" disabled />);
    expect(input().props.editable).toBe(false);
    expect(input().props.accessibilityState).toMatchObject({ disabled: true });
    expect(inputClasses()).toContain('opacity-50');
  });

  it('can be edited by default', async () => {
    await renderWithProviders(<TextField label="Email" />);
    expect(input().props.editable).toBe(true);
    expect(input().props.accessibilityState).toMatchObject({ disabled: false });
  });

  it('is a single 52pt line by default', async () => {
    await renderWithProviders(<TextField label="Email" />);
    expect(input().props.multiline).toBe(false);
    expect(inputClasses()).toContain('h-[52px]');
  });

  it('grows and aligns text to the top in multiline mode', async () => {
    await renderWithProviders(<TextField label="Notes" multiline />);
    expect(input().props.multiline).toBe(true);
    expect(input().props.textAlignVertical).toBe('top');
    expect(inputClasses()).toContain('min-h-[120px]');
  });
});
