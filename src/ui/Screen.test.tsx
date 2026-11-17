import { fireEvent, screen } from '@testing-library/react-native';
import { Pressable, Text as NativeText } from 'react-native';

import { Screen } from './Screen';
import { renderWithProviders, SCHEMES, TEST_SAFE_AREA } from './test-utils';

describe.each(SCHEMES)('Screen (%s mode)', (scheme) => {
  it('renders its children', async () => {
    await renderWithProviders(
      <Screen>
        <NativeText>Inside the screen</NativeText>
      </Screen>,
      { scheme },
    );
    expect(screen.getByText('Inside the screen')).toBeOnTheScreen();
  });
});

describe('Screen layout', () => {
  it('fills the display with the background token', async () => {
    await renderWithProviders(<Screen>{null}</Screen>);
    const classes = screen.getByTestId('screen').props.className.split(' ');
    expect(classes).toEqual(expect.arrayContaining(['flex-1', 'bg-background']));
  });

  it('starts below the status area and keeps the side insets', async () => {
    await renderWithProviders(<Screen>{null}</Screen>);
    const style = screen.getByTestId('screen').props.style;
    expect(style).toMatchObject({
      paddingTop: TEST_SAFE_AREA.insets.top,
      paddingLeft: TEST_SAFE_AREA.insets.left,
      paddingRight: TEST_SAFE_AREA.insets.right,
    });
  });

  it('leaves the bottom to its content by default, because the tab bar owns it', async () => {
    await renderWithProviders(<Screen>{null}</Screen>);
    expect(screen.getByTestId('screen').props.style.paddingBottom).toBe(0);
  });

  it('can respect the bottom inset', async () => {
    await renderWithProviders(<Screen edges={['top', 'bottom']}>{null}</Screen>);
    expect(screen.getByTestId('screen').props.style.paddingBottom).toBe(
      TEST_SAFE_AREA.insets.bottom,
    );
  });

  it('insets its content by the 20pt screen gutter', async () => {
    await renderWithProviders(<Screen>{null}</Screen>);
    expect(screen.getByTestId('screen-content').props.className.split(' ')).toContain('px-gutter');
  });

  it('can drop the gutter', async () => {
    await renderWithProviders(<Screen padded={false}>{null}</Screen>);
    expect(screen.getByTestId('screen-content').props.className.split(' ')).not.toContain(
      'px-gutter',
    );
  });
});

describe('Screen scrolling', () => {
  it('does not scroll by default', async () => {
    await renderWithProviders(<Screen>{null}</Screen>);
    expect(screen.queryByTestId('screen-scroll')).toBeNull();
  });

  it('scrolls its content when asked to', async () => {
    await renderWithProviders(
      <Screen scroll>
        <NativeText>Long content</NativeText>
      </Screen>,
    );
    expect(screen.getByTestId('screen-scroll')).toBeOnTheScreen();
    expect(screen.getByText('Long content')).toBeOnTheScreen();
  });

  it('keeps taps working while the keyboard is open', async () => {
    await renderWithProviders(<Screen scroll>{null}</Screen>);
    expect(screen.getByTestId('screen-scroll').props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('lets a button inside the scrolling content be pressed', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <Screen scroll>
        <Pressable accessibilityRole="button" accessibilityLabel="Save" onPress={onPress} />
      </Screen>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('puts the gutter on the scrolling content', async () => {
    await renderWithProviders(<Screen scroll>{null}</Screen>);
    expect(screen.getByTestId('screen-scroll').props.contentContainerClassName).toContain(
      'px-gutter',
    );
  });
});
