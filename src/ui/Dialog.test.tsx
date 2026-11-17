import { act, fireEvent, screen, userEvent } from '@testing-library/react-native';

import { Dialog } from './Dialog';
import { renderWithProviders, SCHEMES } from './test-utils';

// The backdrop is a sibling of the modal card, so screen readers (and RNTL) treat it as hidden.
const backdrop = () => screen.getByTestId('dialog-backdrop', { includeHiddenElements: true });

type Handlers = { onConfirm?: () => void | Promise<void>; onCancel?: () => void };

function dialog({ onConfirm = jest.fn(), onCancel = jest.fn() }: Handlers = {}) {
  return (
    <Dialog
      visible
      title="Delete entry?"
      message="This also removes its audio."
      confirmLabel="Delete"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

/** A promise the test settles by hand, to hold the dialog in its "confirming" state. */
function controlledPromise() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/**
 * Presses the confirm button the way a user does. Unlike fireEvent, userEvent does not wait for
 * the promise a handler returns, so the dialog can be held in its "confirming" state and
 * inspected before the action is settled.
 */
async function pressConfirmAndLeavePending() {
  const user = userEvent.setup();
  await user.press(screen.getByRole('button', { name: 'Delete' }));
}

describe.each(SCHEMES)('Dialog (%s mode)', (scheme) => {
  it('shows its title, message, and both buttons', async () => {
    await renderWithProviders(dialog(), { scheme });
    expect(screen.getByRole('header', { name: 'Delete entry?' })).toBeOnTheScreen();
    expect(screen.getByText('This also removes its audio.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeOnTheScreen();
  });
});

describe('Dialog visibility and labels', () => {
  it('shows nothing when it is not visible', async () => {
    await renderWithProviders(
      <Dialog visible={false} title="Hidden" onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(screen.queryByText('Hidden')).toBeNull();
  });

  it('defaults to Confirm and Cancel', async () => {
    await renderWithProviders(
      <Dialog visible title="Sure?" onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeOnTheScreen();
  });

  it('takes custom button labels', async () => {
    await renderWithProviders(
      <Dialog
        visible
        title="Sure?"
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Yes' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'No' })).toBeOnTheScreen();
  });

  it('has no message by default', async () => {
    await renderWithProviders(
      <Dialog visible title="Sure?" onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(screen.queryByText('This also removes its audio.')).toBeNull();
  });
});

describe('Dialog confirm and cancel', () => {
  it('calls onConfirm once when the confirm button is pressed', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    await renderWithProviders(dialog({ onConfirm, onCancel }));
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls only onCancel for the cancel button', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    await renderWithProviders(dialog({ onConfirm, onCancel }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls only onCancel for a tap on the backdrop', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    await renderWithProviders(dialog({ onConfirm, onCancel }));
    await fireEvent.press(backdrop());
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls only onCancel for the Android back button', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    await renderWithProviders(dialog({ onConfirm, onCancel }));
    await act(async () => {
      screen.getByTestId('dialog').props.onRequestClose();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe('Dialog with an asynchronous confirm', () => {
  it('shows loading while the confirm action is pending', async () => {
    const { promise, resolve } = controlledPromise();
    await renderWithProviders(dialog({ onConfirm: () => promise }));
    expect(screen.queryByTestId('button-loading')).toBeNull();

    await pressConfirmAndLeavePending();
    expect(screen.getByTestId('button-loading')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Delete', busy: true })).toBeOnTheScreen();

    await act(async () => resolve());
    expect(screen.queryByTestId('button-loading')).toBeNull();
  });

  it('does not close on cancel, backdrop, or back until the action settles', async () => {
    const { promise, resolve } = controlledPromise();
    const onCancel = jest.fn();
    await renderWithProviders(dialog({ onConfirm: () => promise, onCancel }));
    await pressConfirmAndLeavePending();

    await fireEvent.press(screen.getByRole('button', { name: 'Cancel', disabled: true }));
    await fireEvent.press(backdrop());
    await act(async () => {
      screen.getByTestId('dialog').props.onRequestClose();
    });
    expect(onCancel).not.toHaveBeenCalled();

    await act(async () => resolve());
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('ignores a second press on confirm while the action is pending', async () => {
    const { promise, resolve } = controlledPromise();
    const onConfirm = jest.fn(() => promise);
    await renderWithProviders(dialog({ onConfirm }));
    await pressConfirmAndLeavePending();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete', busy: true }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await act(async () => resolve());
  });

  it('does not show loading when the confirm action returns nothing', async () => {
    await renderWithProviders(dialog({ onConfirm: () => undefined }));
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.queryByTestId('button-loading')).toBeNull();
  });
});

describe('Dialog accessibility and look', () => {
  it('is announced as a modal, so content behind it cannot be focused', async () => {
    await renderWithProviders(dialog());
    const card = screen.getByRole('header', { name: 'Delete entry?' }).parent?.parent;
    expect(card?.props.accessibilityViewIsModal).toBe(true);
  });

  it('dims the screen with the scrim token and uses the card radius', async () => {
    await renderWithProviders(dialog());
    expect(backdrop().props.className.split(' ')).toContain('bg-scrim');
    const card = screen.getByRole('header', { name: 'Delete entry?' }).parent?.parent;
    expect(card?.props.className.split(' ')).toEqual(
      expect.arrayContaining(['bg-surface', 'rounded-card']),
    );
  });

  it('hides the backdrop from screen readers, which use the Cancel button instead', async () => {
    await renderWithProviders(dialog());
    expect(backdrop().props.accessible).toBe(false);
  });
});
