import { act, fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders, SCHEMES } from '@/ui/test-utils';

import * as api from '../api';
import { authFailure } from '../errors';
import { OTP_LIFETIME_SECONDS, RESEND_SECONDS } from '../types';
import { VerifyCodeScreen } from './VerifyCodeScreen';

jest.mock('../api', () => ({
  ...jest.requireActual('../api'),
  sendCode: jest.fn(),
  verifyCode: jest.fn(),
}));

const sendCode = jest.mocked(api.sendCode);
const verifyCode = jest.mocked(api.verifyCode);

const START = 1_700_000_000_000;
const EMAIL = 'ada@example.com';
const failed = (code: Parameters<typeof authFailure>[0]) =>
  ({ ok: false, error: authFailure(code) }) as const;

describe.each(SCHEMES)('VerifyCodeScreen (%s)', (scheme) => {
  const render = async (props: { sentAt?: number } = {}) => {
    const onBack = jest.fn();
    await renderWithProviders(
      <VerifyCodeScreen email={EMAIL} sentAt={props.sentAt ?? START} onBack={onBack} />,
      { scheme },
    );
    return { onBack };
  };

  const input = () => screen.getByTestId('code-input-field');
  // The cells are hidden from screen readers (the one input speaks for them), so they are found
  // with includeHiddenElements.
  const cell = (index: number) =>
    screen.getByTestId(`code-cell-${index}`, { includeHiddenElements: true });
  const enter = (text: string) => fireEvent.changeText(input(), text);
  const resendButton = () => screen.getByRole('button', { name: /^Resend code/ });
  const advance = (seconds: number) =>
    act(async () => {
      jest.advanceTimersByTime(seconds * 1000);
    });

  beforeEach(() => {
    jest.useFakeTimers({ now: START });
    sendCode.mockReset();
    verifyCode.mockReset();
  });
  afterEach(() => jest.useRealTimers());

  describe('the screen', () => {
    it('shows where the code was sent, and a hint about spam', async () => {
      await render();

      expect(screen.getByRole('header', { name: 'Check your email' })).toBeOnTheScreen();
      expect(screen.getByText(EMAIL)).toBeOnTheScreen();
      expect(screen.getByText(/Check your spam folder/)).toBeOnTheScreen();
    });

    it('has a 6-cell code input that takes digits only', async () => {
      await render();

      expect(screen.getAllByTestId(/^code-cell-/, { includeHiddenElements: true })).toHaveLength(6);
      expect(input().props.keyboardType).toBe('number-pad');
      expect(input().props.textContentType).toBe('oneTimeCode');
    });

    it('offers a way back to Sign In', async () => {
      const { onBack } = await render();

      await fireEvent.press(screen.getByRole('button', { name: 'Use a different email' }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('checking the code', () => {
    it('checks the code as soon as the sixth digit is entered, with no other button', async () => {
      verifyCode.mockResolvedValue({ ok: true });
      await render();

      await enter('12345');
      expect(verifyCode).not.toHaveBeenCalled();
      await enter('123456');

      expect(verifyCode).toHaveBeenCalledTimes(1);
      expect(verifyCode).toHaveBeenCalledWith(EMAIL, '123456', START);
    });

    it('takes a pasted code with a space, and checks it once', async () => {
      verifyCode.mockResolvedValue({ ok: true });
      await render();

      await enter('123 456');

      expect(input().props.value).toBe('123456');
      expect(verifyCode).toHaveBeenCalledTimes(1);
      expect(verifyCode).toHaveBeenCalledWith(EMAIL, '123456', START);
    });

    it('disables the input while the code is checked', async () => {
      let finish!: (value: { ok: true }) => void;
      verifyCode.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
      await render();

      await enter('123456');
      expect(input().props.editable).toBe(false);

      await act(async () => finish({ ok: true }));
    });

    it('shows no error when the code is right: the route guard moves the user on', async () => {
      verifyCode.mockResolvedValue({ ok: true });
      await render();

      await enter('123456');

      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  describe('a wrong code', () => {
    beforeEach(() => verifyCode.mockResolvedValue(failed('CODE_WRONG')));

    it('shows the error on the field, clears the digits, and brings the cursor back', async () => {
      await render();
      const before = input();

      await enter('123456');

      expect(screen.getByText('That code is not right. Check it and try again.')).toBeOnTheScreen();
      expect(input().props.value).toBe('');
      expect(cell(0)).toHaveTextContent('');
      // A fresh input: it was remounted, so it takes the focus again.
      expect(input()).not.toBe(before);
      expect(input().props.autoFocus).toBe(true);
      expect(input().props.editable).toBe(true);
    });

    it('lets the user try again, and clears the error on the next digit', async () => {
      await render();
      await enter('123456');

      await enter('7');
      expect(screen.queryByText('That code is not right. Check it and try again.')).toBeNull();

      verifyCode.mockResolvedValue({ ok: true });
      await enter('765432');
      expect(verifyCode).toHaveBeenLastCalledWith(EMAIL, '765432', START);
    });
  });

  describe('an expired code', () => {
    beforeEach(() => verifyCode.mockResolvedValue(failed('CODE_EXPIRED')));

    it('says so, and makes Resend the main, enabled action', async () => {
      await render({ sentAt: START - (OTP_LIFETIME_SECONDS + 5) * 1000 });

      await enter('123456');

      expect(screen.getByText('This code has expired. Send a new one.')).toBeOnTheScreen();
      expect(resendButton()).toBeEnabled();
      expect(input().props.value).toBe('');
    });

    it('measures the code lifetime from when the code was requested', async () => {
      const sentAt = START - (OTP_LIFETIME_SECONDS + 5) * 1000;
      await render({ sentAt });

      await enter('123456');

      expect(verifyCode).toHaveBeenCalledWith(EMAIL, '123456', sentAt);
    });
  });

  describe('when checking fails for another reason', () => {
    it.each([
      ['OFFLINE', "You're offline. Check your connection and try again."],
      ['RATE_LIMITED', 'Too many codes requested. Try again in a little while.'],
      ['VERIFY_FAILED', 'Something went wrong. Try again.'],
    ] as const)('%s: keeps the digits and offers a retry', async (code, message) => {
      verifyCode.mockResolvedValueOnce(failed(code)).mockResolvedValueOnce({ ok: true });
      await render();

      await enter('123456');

      expect(screen.getByText(message)).toBeOnTheScreen();
      expect(input().props.value).toBe('123456');

      await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
      expect(verifyCode).toHaveBeenCalledTimes(2);
      expect(verifyCode).toHaveBeenLastCalledWith(EMAIL, '123456', START);
      expect(screen.queryByText(message)).toBeNull();
    });

    it('shows no raw error text', async () => {
      verifyCode.mockResolvedValue(failed('VERIFY_FAILED'));
      await render();

      await enter('123456');

      expect(screen.queryByText(/otp_expired|403|Token|Error:/i)).toBeNull();
    });
  });

  describe('the resend timer', () => {
    it('starts disabled with the time left, and counts down', async () => {
      await render();

      expect(resendButton()).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Resend code in 1:00' })).toBeOnTheScreen();

      await advance(15);
      expect(screen.getByRole('button', { name: 'Resend code in 0:45' })).toBeOnTheScreen();
    });

    it('is enabled at zero', async () => {
      await render();

      await advance(RESEND_SECONDS);

      expect(screen.getByRole('button', { name: 'Resend code' })).toBeEnabled();
    });
  });

  describe('resending', () => {
    const sentAgain = {
      ok: true,
      email: EMAIL,
      requestedAt: START + RESEND_SECONDS * 1000,
    } as const;

    it('requests a new code, restarts the timer, and clears the digits and the error', async () => {
      verifyCode.mockResolvedValue(failed('CODE_WRONG'));
      sendCode.mockResolvedValue(sentAgain);
      await render();
      await enter('123456'); // wrong: an error is showing
      await advance(RESEND_SECONDS);

      await fireEvent.press(screen.getByRole('button', { name: 'Resend code' }));

      expect(sendCode).toHaveBeenCalledWith(EMAIL);
      expect(screen.getByText('A new code is on its way.')).toBeOnTheScreen();
      expect(screen.queryByText('That code is not right. Check it and try again.')).toBeNull();
      expect(input().props.value).toBe('');
      expect(resendButton()).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Resend code in 1:00' })).toBeOnTheScreen();
    });

    it('measures the next code from the new request', async () => {
      sendCode.mockResolvedValue(sentAgain);
      verifyCode.mockResolvedValue({ ok: true });
      await render();
      await advance(RESEND_SECONDS);
      await fireEvent.press(screen.getByRole('button', { name: 'Resend code' }));

      await enter('654321');

      expect(verifyCode).toHaveBeenCalledWith(EMAIL, '654321', sentAgain.requestedAt);
    });

    it('is refused by the server: says so, restarts the timer, keeps the old code lifetime', async () => {
      sendCode.mockResolvedValue(failed('RATE_LIMITED'));
      verifyCode.mockResolvedValue({ ok: true });
      await render();
      await advance(RESEND_SECONDS);

      await fireEvent.press(screen.getByRole('button', { name: 'Resend code' }));

      expect(
        screen.getByText('Too many codes requested. Try again in a little while.'),
      ).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'Resend code in 1:00' })).toBeOnTheScreen();

      // The old code is no younger because a resend was refused.
      await enter('123456');
      expect(verifyCode).toHaveBeenCalledWith(EMAIL, '123456', START);
    });

    it('failing for another reason leaves the timer at zero, so the user can try again', async () => {
      sendCode.mockResolvedValue(failed('OFFLINE'));
      await render();
      await advance(RESEND_SECONDS);

      await fireEvent.press(screen.getByRole('button', { name: 'Resend code' }));

      expect(
        screen.getByText("You're offline. Check your connection and try again."),
      ).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'Resend code' })).toBeEnabled();
    });

    it('shows a busy resend button while the new code is requested', async () => {
      let finish!: (value: typeof sentAgain) => void;
      sendCode.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
      await render();
      await advance(RESEND_SECONDS);

      await fireEvent.press(screen.getByRole('button', { name: 'Resend code' }));

      expect(screen.getByRole('button', { name: 'Resend code', busy: true })).toBeOnTheScreen();
      await act(async () => finish(sentAgain));
    });
  });
});
