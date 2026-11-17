import { fireEvent, screen } from '@testing-library/react-native';
import { Mic, type LucideIcon, type LucideProps } from 'lucide-react-native';
import { View } from 'react-native';

import { colors } from '@/theme';

import { IconButton, type IconButtonVariant } from './IconButton';
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

describe.each(SCHEMES)('IconButton (%s mode)', (scheme) => {
  it('is announced by its label as a button', async () => {
    await renderWithProviders(
      <IconButton icon={Mic} accessibilityLabel="Record" onPress={jest.fn()} />,
      {
        scheme,
      },
    );
    expect(screen.getByRole('button', { name: 'Record' })).toBeOnTheScreen();
  });

  it('uses the fab fill and the on-fab icon color for the fab variant', async () => {
    const { Glyph, last } = createRecordingGlyph();
    await renderWithProviders(
      <IconButton
        icon={Glyph}
        accessibilityLabel="Record"
        onPress={jest.fn()}
        variant="fab"
        testID="fab"
      />,
      { scheme },
    );
    expect(classesOf('fab')).toContain('bg-fab');
    expect(last().color).toBe(colors[scheme]['on-fab']);
  });

  it.each([
    ['plain', 'foreground'],
    ['surface', 'foreground'],
    ['primary', 'on-primary'],
    ['fab', 'on-fab'],
    ['inverse', 'primary'],
  ] as const)('draws the %s variant icon in the %s tone', async (variant, tone) => {
    const { Glyph, last } = createRecordingGlyph();
    await renderWithProviders(
      <IconButton icon={Glyph} accessibilityLabel="Action" onPress={jest.fn()} variant={variant} />,
      { scheme },
    );
    expect(last().color).toBe(colors[scheme][tone]);
  });
});

describe('IconButton label', () => {
  it('requires an accessibility label', () => {
    function missingLabel() {
      // @ts-expect-error: accessibilityLabel is required, so typecheck rejects this call.
      return <IconButton icon={Mic} onPress={jest.fn()} />;
    }
    expect(missingLabel).toBeDefined();
  });
});

describe('IconButton press', () => {
  it('calls onPress once when pressed', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <IconButton icon={Mic} accessibilityLabel="Record" onPress={onPress} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Record' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <IconButton icon={Mic} accessibilityLabel="Record" onPress={onPress} disabled />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Record', disabled: true }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('IconButton variants', () => {
  it.each([
    ['plain', []],
    ['surface', ['bg-surface', 'border-border']],
    ['primary', ['bg-primary']],
    ['fab', ['bg-fab']],
    ['inverse', ['bg-on-primary']],
  ] as [IconButtonVariant, string[]][])('styles the %s variant', async (variant, expected) => {
    await renderWithProviders(
      <IconButton
        icon={Mic}
        accessibilityLabel="Action"
        onPress={jest.fn()}
        variant={variant}
        testID="btn"
      />,
    );
    expect(classesOf('btn')).toEqual(expect.arrayContaining(['rounded-full', ...expected]));
  });

  it.each(['plain', 'surface', 'primary', 'inverse'] as const)(
    'is at least 44 by 44 in the %s variant',
    async (variant) => {
      await renderWithProviders(
        <IconButton
          icon={Mic}
          accessibilityLabel="Action"
          onPress={jest.fn()}
          variant={variant}
          testID="btn"
        />,
      );
      // h-11 and w-11 are 44pt.
      expect(classesOf('btn')).toEqual(expect.arrayContaining(['h-11', 'w-11']));
    },
  );

  it('is 56 by 56 as the record button', async () => {
    await renderWithProviders(
      <IconButton
        icon={Mic}
        accessibilityLabel="Record"
        onPress={jest.fn()}
        variant="fab"
        testID="btn"
      />,
    );
    expect(classesOf('btn')).toEqual(expect.arrayContaining(['h-14', 'w-14']));
  });
});
