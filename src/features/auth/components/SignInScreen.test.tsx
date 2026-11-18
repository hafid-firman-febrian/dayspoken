import { act, fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders, SCHEMES } from '@/ui/test-utils';

import * as api from '../api';
import { authFailure } from '../errors';
import { SignInScreen } from './SignInScreen';

jest.mock('../api', () => ({
  ...jest.requireActual('../api'),
  sendCode: jest.fn(),
}));

const sendCode = jest.mocked(api.sendCode);

const sent = (email = 'ada@example.com', requestedAt = 1234) =>
  ({ ok: true, email, requestedAt }) as const;
const failed = (code: Parameters<typeof authFailure>[0]) =>
  ({ ok: false, error: authFailure(code) }) as const;

describe.each(SCHEMES)('SignInScreen (%s)', (scheme) => {
  const render = async (props: Partial<Parameters<typeof SignInScreen>[0]> = {}) => {
    const onCodeSent = jest.fn();
    await renderWithProviders(<SignInScreen onCodeSent={onCodeSent} {...props} />, { scheme });
    return { onCodeSent };
  };

  const field = () => screen.getByLabelText('Email');
  const sendButton = () => screen.getByRole('button', { name: 'Send code' });
  const type = (text: string) => fireEvent.changeText(field(), text);

  beforeEach(() => sendCode.mockReset());

  it('shows the title, one email field, and the send button', async () => {
    await render();

    expect(screen.getByRole('header', { name: 'Sign in' })).toBeOnTheScreen();
    expect(field()).toBeOnTheScreen();
    expect(sendButton()).toBeOnTheScreen();
  });

  it('offers an email keyboard and does not capitalize', async () => {
    await render();

    expect(field().props.keyboardType).toBe('email-address');
    expect(field().props.autoCapitalize).toBe('none');
    expect(field().props.autoCorrect).toBe(false);
  });

  it('starts with the address typed before, for a return from Verify Code', async () => {
    await render({ initialEmail: 'ada@example.com' });

    expect(field().props.value).toBe('ada@example.com');
  });

  describe('a valid address', () => {
    it('requests a code and opens Verify Code with the address as sent', async () => {
      sendCode.mockResolvedValue(sent('ada@example.com', 4242));
      const { onCodeSent } = await render();

      await type('Ada@Example.com ');
      await fireEvent.press(sendButton());

      expect(sendCode).toHaveBeenCalledWith('Ada@Example.com ');
      expect(onCodeSent).toHaveBeenCalledWith('ada@example.com', 4242);
    });

    it('sends from the keyboard too', async () => {
      sendCode.mockResolvedValue(sent());
      const { onCodeSent } = await render();

      await type('ada@example.com');
      await fireEvent(field(), 'submitEditing');

      expect(onCodeSent).toHaveBeenCalledTimes(1);
    });
  });

  describe('an invalid address', () => {
    it.each(['ada@', 'ada', '', '   '])('shows an error for %p and sends nothing', async (text) => {
      const { onCodeSent } = await render();

      await type(text);
      await fireEvent.press(sendButton());

      expect(screen.getByText('Enter a valid email address.')).toBeOnTheScreen();
      expect(sendCode).not.toHaveBeenCalled();
      expect(onCodeSent).not.toHaveBeenCalled();
    });

    it('clears the error as soon as the user edits the field', async () => {
      await render();
      await type('ada@');
      await fireEvent.press(sendButton());
      expect(screen.getByText('Enter a valid email address.')).toBeOnTheScreen();

      await type('ada@e');

      expect(screen.queryByText('Enter a valid email address.')).toBeNull();
    });

    it('announces the error to a screen reader', async () => {
      await render();
      await type('ada@');
      await fireEvent.press(sendButton());

      expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
    });
  });

  describe('while the code is being requested', () => {
    let finish!: (value: Awaited<ReturnType<typeof api.sendCode>>) => void;
    beforeEach(() => {
      sendCode.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    });

    it('shows a busy button and a read-only field', async () => {
      await render();
      await type('ada@example.com');
      await fireEvent.press(sendButton());

      expect(screen.getByRole('button', { name: 'Send code', busy: true })).toBeOnTheScreen();
      expect(field().props.editable).toBe(false);

      await act(async () => finish(sent()));
    });

    it('requests one code when the button is pressed twice', async () => {
      await render();
      await type('ada@example.com');

      await fireEvent.press(sendButton());
      await fireEvent.press(screen.getByRole('button', { name: 'Send code' }));
      await fireEvent(field(), 'submitEditing');

      expect(sendCode).toHaveBeenCalledTimes(1);
      await act(async () => finish(sent()));
    });
  });

  describe('when sending fails', () => {
    it.each([
      ['RATE_LIMITED', 'Too many codes requested. Try again in a little while.'],
      ['OFFLINE', "You're offline. Check your connection and try again."],
      ['SEND_FAILED', 'We could not send the code. Try again.'],
    ] as const)('%s: stays on Sign In and keeps the text', async (code, message) => {
      sendCode.mockResolvedValue(failed(code));
      const { onCodeSent } = await render();

      await type('ada@example.com');
      await fireEvent.press(sendButton());

      expect(screen.getByText(message)).toBeOnTheScreen();
      expect(field().props.value).toBe('ada@example.com');
      expect(onCodeSent).not.toHaveBeenCalled();
      expect(sendButton()).toBeEnabled();
    });

    it('shows no raw error text', async () => {
      sendCode.mockResolvedValue(failed('SEND_FAILED'));
      await render();

      await type('ada@example.com');
      await fireEvent.press(sendButton());

      expect(screen.queryByText(/smtp|550|unexpected_failure|Error:/i)).toBeNull();
    });

    it('lets the user try again, and clears the message on the next edit', async () => {
      sendCode.mockResolvedValueOnce(failed('SEND_FAILED')).mockResolvedValueOnce(sent());
      const { onCodeSent } = await render();
      await type('ada@example.com');

      await fireEvent.press(sendButton());
      expect(screen.getByText('We could not send the code. Try again.')).toBeOnTheScreen();

      await type('ada@example.com ');
      expect(screen.queryByText('We could not send the code. Try again.')).toBeNull();

      await fireEvent.press(sendButton());
      expect(onCodeSent).toHaveBeenCalledTimes(1);
    });
  });
});
