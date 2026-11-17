import { act, fireEvent, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Pressable, Text as NativeText } from 'react-native';

import { renderWithProviders, SCHEMES, TEST_SAFE_AREA } from './test-utils';
import { useToast, type ToastOptions } from './Toast';

// A button that shows toasts, the way a screen would.
function Trigger({ messages, options }: { messages: string[]; options?: ToastOptions }) {
  const { show } = useToast();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Show"
      onPress={() => messages.forEach((message) => show(message, options))}
    >
      <NativeText>Show</NativeText>
    </Pressable>
  );
}

async function pressShow() {
  await fireEvent.press(screen.getByRole('button', { name: 'Show' }));
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe.each(SCHEMES)('Toast (%s mode)', (scheme) => {
  it('shows a message', async () => {
    await renderWithProviders(<Trigger messages={['Entry saved']} />, { scheme });
    await pressShow();
    expect(screen.getByText('Entry saved')).toBeOnTheScreen();
  });
});

describe('Toast timing', () => {
  it('shows nothing until a toast is requested', async () => {
    await renderWithProviders(<Trigger messages={['Entry saved']} />);
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('hides by itself after about 4 seconds', async () => {
    await renderWithProviders(<Trigger messages={['Entry saved']} />);
    await pressShow();
    await advance(3900);
    expect(screen.getByText('Entry saved')).toBeOnTheScreen();
    await advance(200);
    expect(screen.queryByText('Entry saved')).toBeNull();
  });

  it('stays about 6 seconds when it has an action', async () => {
    await renderWithProviders(
      <Trigger
        messages={['Entry deleted']}
        options={{ actionLabel: 'Undo', onAction: jest.fn() }}
      />,
    );
    await pressShow();
    await advance(5000);
    expect(screen.getByText('Entry deleted')).toBeOnTheScreen();
    await advance(1100);
    expect(screen.queryByText('Entry deleted')).toBeNull();
  });

  it('takes a custom duration', async () => {
    await renderWithProviders(<Trigger messages={['Quick']} options={{ duration: 1000 }} />);
    await pressShow();
    await advance(1100);
    expect(screen.queryByText('Quick')).toBeNull();
  });
});

describe('Toast queue', () => {
  it('shows two quick toasts one after the other', async () => {
    await renderWithProviders(<Trigger messages={['First', 'Second']} />);
    await pressShow();
    expect(screen.getByText('First')).toBeOnTheScreen();
    expect(screen.queryByText('Second')).toBeNull();

    await advance(4100);
    expect(screen.queryByText('First')).toBeNull();
    expect(screen.getByText('Second')).toBeOnTheScreen();

    await advance(4100);
    expect(screen.queryByText('Second')).toBeNull();
  });

  it('shows toasts in the order they were requested', async () => {
    await renderWithProviders(<Trigger messages={['One', 'Two', 'Three']} />);
    await pressShow();
    const seen: string[] = [];
    for (const expected of ['One', 'Two', 'Three']) {
      expect(screen.getByText(expected)).toBeOnTheScreen();
      seen.push(expected);
      await advance(4100);
    }
    expect(seen).toEqual(['One', 'Two', 'Three']);
  });
});

describe('Toast action', () => {
  it('calls the action and hides the toast when the action is pressed', async () => {
    const onAction = jest.fn();
    await renderWithProviders(
      <Trigger messages={['Entry deleted']} options={{ actionLabel: 'Undo', onAction }} />,
    );
    await pressShow();
    await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Entry deleted')).toBeNull();
  });

  it('shows no action button without an action', async () => {
    await renderWithProviders(<Trigger messages={['Entry saved']} />);
    await pressShow();
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });
});

describe('Toast accessibility and placement', () => {
  it('announces the message to screen readers', async () => {
    await renderWithProviders(<Trigger messages={['Entry saved']} />);
    await pressShow();
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Entry saved');
  });

  it('is a polite alert, with the action outside the announced message', async () => {
    await renderWithProviders(
      <Trigger
        messages={['Entry deleted']}
        options={{ actionLabel: 'Undo', onAction: jest.fn() }}
      />,
    );
    await pressShow();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Entry deleted');
    expect(alert.props.accessibilityLiveRegion).toBe('polite');
    expect(alert).not.toContainElement(screen.getByRole('button', { name: 'Undo' }));
  });

  it('sits below the status bar, never over it', async () => {
    await renderWithProviders(<Trigger messages={['Entry saved']} />);
    await pressShow();
    const host = screen.getByTestId('toast').parent;
    expect(host?.props.style).toMatchObject({ paddingTop: TEST_SAFE_AREA.insets.top + 8 });
  });

  it('does not block touches on the screen behind it', async () => {
    await renderWithProviders(<Trigger messages={['Entry saved']} />);
    await pressShow();
    expect(screen.getByTestId('toast').parent?.props.pointerEvents).toBe('box-none');
  });
});

describe('useToast', () => {
  it('explains the problem when there is no provider', async () => {
    jest.restoreAllMocks();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useToast();
      return null;
    }
    // Rendered with the plain RNTL render, so no ToastProvider wraps it.
    const { render } = jest.requireActual('@testing-library/react-native');
    await expect(render(<Orphan />)).rejects.toThrow(/inside ToastProvider/);
    consoleError.mockRestore();
  });
});
