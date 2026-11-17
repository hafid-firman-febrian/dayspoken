import { act, fireEvent, screen } from '@testing-library/react-native';
import { useState, type ReactElement } from 'react';
import { BackHandler, Pressable, StyleSheet, Text as NativeText } from 'react-native';

import { colors, radius } from '@/theme';

import { BottomSheet } from './BottomSheet';
import { renderWithProviders, SCHEMES } from './test-utils';
import { TextField } from './TextField';

// A controllable stand-in for @gorhom/bottom-sheet. The library's own Jest mock always renders
// its children, so it cannot show open and close. This fake renders them only while presented,
// and records the props BottomSheet gives it, so the way we use the library can be asserted.
const mockSheet = {
  props: null as null | Record<string, any>,
  present: jest.fn(),
  dismiss: jest.fn(),
};

/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View, TextInput } = require('react-native');

  const BottomSheetModal = React.forwardRef(function BottomSheetModal(props: any, ref: any) {
    const [presented, setPresented] = React.useState(false);
    // Recorded after each render, so a test can read the props BottomSheet passed.
    React.useEffect(() => {
      mockSheet.props = props;
    });
    React.useImperativeHandle(ref, () => ({
      present: () => {
        mockSheet.present();
        setPresented(true);
      },
      dismiss: () => {
        mockSheet.dismiss();
        setPresented(false);
        props.onDismiss?.();
      },
    }));
    return presented ? <View testID="sheet">{props.children}</View> : null;
  });

  return {
    BottomSheetModal,
    BottomSheetModalProvider: ({ children }: any) => children,
    BottomSheetView: ({ children, style }: any) => (
      <View testID="sheet-view" style={style}>
        {children}
      </View>
    ),
    BottomSheetBackdrop: (props: any) => <View testID="backdrop" {...props} />,
    // Marks itself, so a test can tell it from a plain TextInput.
    BottomSheetTextInput: (props: any) => <TextInput {...props} nativeID="sheet-input" />,
  };
});
/* eslint-enable @typescript-eslint/no-require-imports */

type HarnessProps = { initialOpen?: boolean; onClose?: () => void; title?: string };

// Holds `open` the way a screen would, and lets a test open and close the sheet from outside.
function Harness({ initialOpen = false, onClose = jest.fn(), title }: HarnessProps) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Open" onPress={() => setOpen(true)}>
        <NativeText>Open</NativeText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={() => setOpen(false)}
      >
        <NativeText>Close</NativeText>
      </Pressable>
      <BottomSheet
        open={open}
        title={title}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
      >
        <NativeText>Sheet content</NativeText>
      </BottomSheet>
    </>
  );
}

/** What the library does when the user closes the sheet (backdrop tap or swipe down). */
async function userClosesTheSheet() {
  await act(async () => {
    mockSheet.props?.onDismiss();
  });
}

beforeEach(() => {
  mockSheet.props = null;
  mockSheet.present.mockClear();
  mockSheet.dismiss.mockClear();
});

describe.each(SCHEMES)('BottomSheet (%s mode)', (scheme) => {
  it('is closed by default', async () => {
    await renderWithProviders(<Harness />, { scheme });
    expect(screen.queryByText('Sheet content')).toBeNull();
    expect(mockSheet.present).not.toHaveBeenCalled();
  });

  it('presents its content when it opens', async () => {
    await renderWithProviders(<Harness />, { scheme });
    await fireEvent.press(screen.getByRole('button', { name: 'Open' }));
    expect(mockSheet.present).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Sheet content')).toBeOnTheScreen();
  });

  it('uses the surface fill and the card radius on top', async () => {
    await renderWithProviders(<Harness initialOpen />, { scheme });
    expect(mockSheet.props?.backgroundStyle).toEqual({
      backgroundColor: colors[scheme].surface,
      borderTopLeftRadius: radius.card,
      borderTopRightRadius: radius.card,
    });
  });

  it('draws the handle in the muted token', async () => {
    await renderWithProviders(<Harness initialOpen />, { scheme });
    expect(mockSheet.props?.handleIndicatorStyle).toEqual({
      backgroundColor: colors[scheme].muted,
    });
  });

  it('dims the screen behind it with the scrim token, and closes when the backdrop is tapped', async () => {
    await renderWithProviders(<Harness initialOpen />, { scheme });
    const backdrop = mockSheet.props?.backdropComponent({ style: { opacity: 0 } }) as ReactElement<
      Record<string, any>
    >;
    expect(backdrop.props.pressBehavior).toBe('close');
    expect(backdrop.props.appearsOnIndex).toBe(0);
    expect(backdrop.props.disappearsOnIndex).toBe(-1);
    expect(StyleSheet.flatten(backdrop.props.style).backgroundColor).toBe(colors[scheme].scrim);
  });
});

describe('BottomSheet opening and closing', () => {
  it('opens when it starts open', async () => {
    await renderWithProviders(<Harness initialOpen />);
    expect(screen.getByText('Sheet content')).toBeOnTheScreen();
  });

  it('reports a close by the user once', async () => {
    const onClose = jest.fn();
    await renderWithProviders(<Harness initialOpen onClose={onClose} />);
    await userClosesTheSheet();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dismisses when the owner sets open to false, without reporting a user close', async () => {
    const onClose = jest.fn();
    await renderWithProviders(<Harness initialOpen onClose={onClose} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(mockSheet.dismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Sheet content')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('can be opened again after it was closed', async () => {
    await renderWithProviders(<Harness initialOpen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Open' }));
    expect(mockSheet.present).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Sheet content')).toBeOnTheScreen();
  });

  it('closes on swipe down', async () => {
    await renderWithProviders(<Harness initialOpen />);
    expect(mockSheet.props?.enablePanDownToClose).toBe(true);
  });

  it('sizes itself to its content', async () => {
    await renderWithProviders(<Harness initialOpen />);
    expect(mockSheet.props?.enableDynamicSizing).toBe(true);
    expect(mockSheet.props?.snapPoints).toBeUndefined();
  });
});

describe('BottomSheet and the Android back button', () => {
  function captureBackHandler() {
    let handler: ((event: never) => unknown) | undefined;
    const remove = jest.fn();
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, listener) => {
      handler = listener;
      return { remove };
    });
    return {
      press: () => handler?.(undefined as never),
      remove,
      isRegistered: () => handler !== undefined,
    };
  }

  afterEach(() => jest.restoreAllMocks());

  it('closes the sheet instead of the screen', async () => {
    const onClose = jest.fn();
    const back = captureBackHandler();
    await renderWithProviders(<Harness initialOpen onClose={onClose} />);
    let handled: unknown;
    await act(async () => {
      handled = back.press();
    });
    expect(handled).toBe(true);
    expect(mockSheet.dismiss).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not take the back button while the sheet is closed', async () => {
    const back = captureBackHandler();
    await renderWithProviders(<Harness />);
    expect(back.isRegistered()).toBe(false);
  });

  it('gives the back button back when the sheet closes', async () => {
    const back = captureBackHandler();
    await renderWithProviders(<Harness initialOpen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(back.remove).toHaveBeenCalled();
  });
});

describe('BottomSheet title and keyboard', () => {
  it('shows its title at the top, announced as a header', async () => {
    await renderWithProviders(<Harness initialOpen title="Edit entry" />);
    expect(screen.getByRole('header', { name: 'Edit entry' })).toBeOnTheScreen();
  });

  it('has no header without a title', async () => {
    await renderWithProviders(<Harness initialOpen />);
    expect(screen.queryByRole('header')).toBeNull();
  });

  it('moves up above the keyboard and goes back down after it', async () => {
    await renderWithProviders(<Harness initialOpen />);
    expect(mockSheet.props?.keyboardBehavior).toBe('interactive');
    expect(mockSheet.props?.keyboardBlurBehavior).toBe('restore');
    // Left at the library default: "adjustResize" kept the sheet behind the keyboard on Android.
    expect(mockSheet.props?.android_keyboardInputMode).toBeUndefined();
  });

  it('keeps its content clear of the bottom inset', async () => {
    await renderWithProviders(<Harness initialOpen />);
    const style = StyleSheet.flatten(screen.getByTestId('sheet-view').props.style);
    expect(style.paddingBottom).toBeGreaterThan(0);
    expect(style.paddingHorizontal).toBe(20);
  });
});

describe('TextField inside a BottomSheet', () => {
  it('uses the sheet input, so the sheet can move above the keyboard', async () => {
    await renderWithProviders(
      <BottomSheet open onClose={jest.fn()}>
        <TextField label="Title" />
      </BottomSheet>,
    );
    expect(screen.getByLabelText('Title').props.nativeID).toBe('sheet-input');
  });

  it('uses a plain input outside a sheet', async () => {
    await renderWithProviders(<TextField label="Title" />);
    expect(screen.getByLabelText('Title').props.nativeID).toBeUndefined();
  });
});
