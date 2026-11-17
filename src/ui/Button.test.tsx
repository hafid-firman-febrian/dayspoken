import { fireEvent, screen } from '@testing-library/react-native';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { View } from 'react-native';

import { colors } from '@/theme';

import { Button } from './Button';
import { renderWithProviders, SCHEMES } from './test-utils';

function createRecordingGlyph() {
  const calls: LucideProps[] = [];
  const Glyph = ((props: LucideProps) => {
    calls.push(props);
    return <View testID="glyph" />;
  }) as unknown as LucideIcon;
  return { Glyph, last: () => calls[calls.length - 1] };
}

const classesOf = (testID: string): string[] =>
  screen.getByTestId(testID).props.className.split(' ');

describe.each(SCHEMES)('Button (%s mode)', (scheme) => {
  it('shows its label and is announced as a button', async () => {
    await renderWithProviders(<Button label="Save" onPress={jest.fn()} />, { scheme });
    expect(screen.getByText('Save')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save' })).toBeOnTheScreen();
  });

  it.each([
    ['primary', 'on-primary'],
    ['secondary', 'foreground'],
    ['ghost', 'accent'],
  ] as const)('draws the leading icon of the %s variant in the %s tone', async (variant, tone) => {
    const { Glyph, last } = createRecordingGlyph();
    await renderWithProviders(
      <Button label="Go" onPress={jest.fn()} variant={variant} icon={Glyph} />,
      {
        scheme,
      },
    );
    expect(last().color).toBe(colors[scheme][tone]);
  });
});

describe('Button press', () => {
  it('calls onPress once when pressed', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Save" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled, and says it is disabled', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Save" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Save', disabled: true });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Button loading', () => {
  it('shows a spinner, says it is busy, and ignores presses', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Save" onPress={onPress} loading testID="btn" />);
    expect(screen.getByTestId('button-loading')).toBeOnTheScreen();
    const button = screen.getByRole('button', { name: 'Save', busy: true });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('replaces the leading icon with the spinner and keeps the label', async () => {
    const { Glyph } = createRecordingGlyph();
    await renderWithProviders(<Button label="Save" onPress={jest.fn()} icon={Glyph} loading />);
    expect(screen.queryByTestId('glyph')).toBeNull();
    expect(screen.getByTestId('button-loading')).toBeOnTheScreen();
    expect(screen.getByText('Save')).toBeOnTheScreen();
  });

  it('shows no spinner when it is not loading', async () => {
    await renderWithProviders(<Button label="Save" onPress={jest.fn()} />);
    expect(screen.queryByTestId('button-loading')).toBeNull();
  });

  it.each(SCHEMES)('colors the spinner from the tokens in %s mode', async (scheme) => {
    await renderWithProviders(<Button label="Save" onPress={jest.fn()} loading />, { scheme });
    expect(screen.getByTestId('button-loading').props.color).toBe(colors[scheme]['on-primary']);
  });
});

describe('Button variants and sizes', () => {
  it('is a primary pill by default', async () => {
    await renderWithProviders(<Button label="Save" onPress={jest.fn()} testID="btn" />);
    expect(classesOf('btn')).toEqual(expect.arrayContaining(['rounded-full', 'bg-primary']));
    expect(screen.getByText('Save').props.className.split(' ')).toContain('text-on-primary');
  });

  it('is a surface with a border in the secondary variant', async () => {
    await renderWithProviders(
      <Button label="Save" onPress={jest.fn()} variant="secondary" testID="btn" />,
    );
    expect(classesOf('btn')).toEqual(
      expect.arrayContaining(['bg-surface', 'border', 'border-border']),
    );
    expect(screen.getByText('Save').props.className.split(' ')).toContain('text-foreground');
  });

  it('has no fill and accent text in the ghost variant', async () => {
    await renderWithProviders(
      <Button label="Save" onPress={jest.fn()} variant="ghost" testID="btn" />,
    );
    expect(classesOf('btn').some((name) => name.startsWith('bg-'))).toBe(false);
    expect(screen.getByText('Save').props.className.split(' ')).toContain('text-accent');
  });

  it('keeps the touch target at 44 for the small size', async () => {
    await renderWithProviders(<Button label="Save" onPress={jest.fn()} size="sm" testID="btn" />);
    expect(classesOf('btn')).toContain('h-10');
    expect(screen.getByTestId('btn').props.hitSlop).toEqual({
      top: 2,
      bottom: 2,
      left: 2,
      right: 2,
    });
  });

  it('needs no extra hit area at the medium size, which is 52 high', async () => {
    await renderWithProviders(<Button label="Save" onPress={jest.fn()} testID="btn" />);
    expect(classesOf('btn')).toContain('h-[52px]');
    expect(screen.getByTestId('btn').props.hitSlop).toBeUndefined();
  });

  it('takes the full width when asked to', async () => {
    await renderWithProviders(<Button label="Save" onPress={jest.fn()} fullWidth testID="btn" />);
    expect(classesOf('btn')).toContain('w-full');
  });

  it('can be named differently for screen readers', async () => {
    await renderWithProviders(
      <Button label="Save" accessibilityLabel="Save entry" onPress={jest.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Save entry' })).toBeOnTheScreen();
  });
});
