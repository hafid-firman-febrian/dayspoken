import { fireEvent, screen } from '@testing-library/react-native';
import { WifiOff, type LucideIcon, type LucideProps } from 'lucide-react-native';
import { View } from 'react-native';

import { colors } from '@/theme';

import { Banner } from './Banner';
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

describe.each(SCHEMES)('Banner (%s mode)', (scheme) => {
  it('shows its message', async () => {
    await renderWithProviders(<Banner message="You're offline" />, { scheme });
    expect(screen.getByText("You're offline")).toBeOnTheScreen();
  });

  it.each([
    ['neutral', 'muted'],
    ['accent', 'accent'],
  ] as const)('draws the icon of the %s tone in the %s token', async (tone, expected) => {
    const { Glyph, last } = createRecordingGlyph();
    await renderWithProviders(<Banner message="Heads up" tone={tone} icon={Glyph} />, { scheme });
    expect(last().color).toBe(colors[scheme][expected]);
  });
});

describe('Banner content and tones', () => {
  it('shows an icon with the message', async () => {
    await renderWithProviders(<Banner message="You're offline" icon={WifiOff} />);
    expect(screen.getByText("You're offline")).toBeOnTheScreen();
    expect(screen.getByTestId('banner-message')).toBeOnTheScreen();
  });

  it('is neutral by default, with a quiet border', async () => {
    await renderWithProviders(<Banner message="Hello" testID="banner" />);
    expect(classesOf('banner')).toEqual(expect.arrayContaining(['bg-surface', 'border-border']));
  });

  it('has an accent outline in the accent tone', async () => {
    await renderWithProviders(<Banner message="Hello" tone="accent" testID="banner" />);
    expect(classesOf('banner')).toEqual(expect.arrayContaining(['border-2', 'border-accent']));
    expect(classesOf('banner')).not.toContain('border-border');
  });
});

describe('Banner accessibility', () => {
  it('announces its message politely', async () => {
    await renderWithProviders(<Banner message="You're offline" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent("You're offline");
    expect(alert.props.accessibilityLiveRegion).toBe('polite');
  });

  it('keeps the action and dismiss buttons outside the announced message', async () => {
    await renderWithProviders(
      <Banner
        message="Hello"
        actionLabel="Retry"
        onActionPress={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );
    const alert = screen.getByRole('alert');
    expect(alert).not.toContainElement(screen.getByRole('button', { name: 'Retry' }));
    expect(alert).not.toContainElement(screen.getByRole('button', { name: 'Dismiss' }));
  });
});

describe('Banner action and dismiss', () => {
  it('has no buttons by default', async () => {
    await renderWithProviders(<Banner message="Hello" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('calls the action when it is pressed', async () => {
    const onActionPress = jest.fn();
    await renderWithProviders(
      <Banner message="Hello" actionLabel="Retry" onActionPress={onActionPress} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onActionPress).toHaveBeenCalledTimes(1);
  });

  it('shows no action without a handler', async () => {
    await renderWithProviders(<Banner message="Hello" actionLabel="Retry" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows a close button labeled "Dismiss" that calls onDismiss', async () => {
    const onDismiss = jest.fn();
    await renderWithProviders(<Banner message="Hello" onDismiss={onDismiss} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
