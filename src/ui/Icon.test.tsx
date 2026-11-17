import { screen } from '@testing-library/react-native';
import { Mic, WifiOff, type LucideIcon, type LucideProps } from 'lucide-react-native';
import { View } from 'react-native';

import { colors } from '@/theme';

import { Icon } from './Icon';
import { renderWithProviders, SCHEMES } from './test-utils';

// A stand-in glyph that records the props Icon gives it, so colors can be read directly.
function createRecordingGlyph() {
  const calls: LucideProps[] = [];
  const Glyph = ((props: LucideProps) => {
    calls.push(props);
    return <View testID="glyph" />;
  }) as unknown as LucideIcon;
  return { Glyph, last: () => calls[calls.length - 1] };
}

describe.each(SCHEMES)('Icon (%s mode)', (scheme) => {
  it('uses the foreground token by default', async () => {
    const { Glyph, last } = createRecordingGlyph();
    await renderWithProviders(<Icon icon={Glyph} />, { scheme });
    expect(last().color).toBe(colors[scheme].foreground);
  });

  it.each(['muted', 'accent', 'on-primary', 'on-fab'] as const)(
    'takes the %s tone from the tokens of the current mode',
    async (tone) => {
      const { Glyph, last } = createRecordingGlyph();
      await renderWithProviders(<Icon icon={Glyph} tone={tone} />, { scheme });
      expect(last().color).toBe(colors[scheme][tone]);
    },
  );

  it('defaults to size 20 and stroke width 2', async () => {
    const { Glyph, last } = createRecordingGlyph();
    await renderWithProviders(<Icon icon={Glyph} />, { scheme });
    expect(last().size).toBe(20);
    expect(last().strokeWidth).toBe(2);
  });

  it('takes a custom size and stroke width', async () => {
    const { Glyph, last } = createRecordingGlyph();
    await renderWithProviders(<Icon icon={Glyph} size={32} strokeWidth={1.5} />, { scheme });
    expect(last().size).toBe(32);
    expect(last().strokeWidth).toBe(1.5);
  });
});

describe('Icon accessibility', () => {
  it('is hidden from screen readers without a label', async () => {
    await renderWithProviders(<Icon icon={Mic} testID="decorative" />);
    expect(screen.queryByTestId('decorative')).toBeNull();
    expect(screen.getByTestId('decorative', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('is announced as an image with its label', async () => {
    await renderWithProviders(<Icon icon={WifiOff} accessibilityLabel="Offline" />);
    expect(screen.getByRole('image', { name: 'Offline' })).toBeOnTheScreen();
  });
});
