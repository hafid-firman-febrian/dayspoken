import { fireEvent, screen } from '@testing-library/react-native';
import { Text as NativeText } from 'react-native';

import { Card } from './Card';
import { Text } from './Text';
import { renderWithProviders, SCHEMES } from './test-utils';

const classesOf = (testID: string): string[] =>
  screen.getByTestId(testID).props.className.split(' ');

describe.each(SCHEMES)('Card (%s mode)', (scheme) => {
  it('renders its children', async () => {
    await renderWithProviders(
      <Card>
        <NativeText>Inside</NativeText>
      </Card>,
      { scheme },
    );
    expect(screen.getByText('Inside')).toBeOnTheScreen();
  });
});

describe('Card styling', () => {
  it('is a surface with the card radius and padding by default', async () => {
    await renderWithProviders(<Card testID="card" />);
    expect(classesOf('card')).toEqual(
      expect.arrayContaining(['bg-surface', 'rounded-card', 'p-5']),
    );
  });

  it('is primary with the hero radius in the hero variant', async () => {
    await renderWithProviders(<Card testID="card" variant="hero" />);
    const classes = classesOf('card');
    expect(classes).toEqual(expect.arrayContaining(['bg-primary', 'rounded-hero']));
    expect(classes).not.toContain('bg-surface');
    expect(classes).not.toContain('rounded-card');
  });

  it('adds extra class names', async () => {
    await renderWithProviders(<Card testID="card" className="mb-4" />);
    expect(classesOf('card')).toContain('mb-4');
  });
});

describe('Card text tone', () => {
  it('makes text white on a hero card without the Text asking for it', async () => {
    await renderWithProviders(
      <Card variant="hero">
        <Text>On the hero</Text>
      </Card>,
    );
    expect(screen.getByText('On the hero').props.className.split(' ')).toContain('text-on-primary');
  });

  it('keeps foreground text on a default card', async () => {
    await renderWithProviders(
      <Card>
        <Text>On the card</Text>
      </Card>,
    );
    expect(screen.getByText('On the card').props.className.split(' ')).toContain('text-foreground');
  });

  it('does not pass white text on to a default card nested in a hero card', async () => {
    await renderWithProviders(
      <Card variant="hero">
        <Card>
          <Text>Nested</Text>
        </Card>
      </Card>,
    );
    expect(screen.getByText('Nested').props.className.split(' ')).toContain('text-foreground');
  });
});

describe('Card as a button', () => {
  it('is not a button without onPress', async () => {
    await renderWithProviders(
      <Card>
        <Text>Static</Text>
      </Card>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <Card onPress={onPress} accessibilityLabel="Open entry">
        <Text>Tap</Text>
      </Card>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Open entry' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is announced as one button', async () => {
    await renderWithProviders(
      <Card onPress={jest.fn()} accessibilityLabel="Open entry">
        <Text>Tap</Text>
      </Card>,
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
