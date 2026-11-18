import { Slot } from 'expo-router';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeScope } from '@/theme';
import { UiProvider } from '@/ui';
import { TEST_SAFE_AREA } from '@/ui/test-utils';

import * as AuthLayout from '../../app/(auth)/_layout';
import SignInRoute from '../../app/(auth)/sign-in';
import VerifyRoute from '../../app/(auth)/verify';
import WelcomeRoute from '../../app/(auth)/welcome';

// These tests are about how the three screens are wired together, not about the guard (that is
// layout.test.tsx), so the layout here is only the providers around a Slot.
jest.mock('@/features/auth/api', () => ({
  ...jest.requireActual('@/features/auth/api'),
  sendCode: jest.fn(),
  verifyCode: jest.fn(),
}));
// eslint-disable-next-line import/first
import * as api from '@/features/auth/api';

const sendCode = jest.mocked(api.sendCode);

function Layout() {
  return (
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      <ThemeScope scheme="light">
        <UiProvider>
          <Slot />
        </UiProvider>
      </ThemeScope>
    </SafeAreaProvider>
  );
}

const routes = {
  _layout: Layout,
  '(auth)/_layout': AuthLayout,
  '(auth)/welcome': WelcomeRoute,
  '(auth)/sign-in': SignInRoute,
  '(auth)/verify': VerifyRoute,
};

describe('the auth routes', () => {
  beforeEach(() => sendCode.mockReset());

  it('opens Sign In from Welcome with Get started', async () => {
    await renderRouter(routes, { initialUrl: '/welcome' });

    await fireEvent.press(screen.getByRole('button', { name: 'Get started' }));

    expect(screen).toHavePathname('/sign-in');
    expect(screen.getByRole('header', { name: 'Sign in' })).toBeOnTheScreen();
  });

  it('opens Verify Code with the address and the send time after a code is sent', async () => {
    sendCode.mockResolvedValue({ ok: true, email: 'ada@example.com', requestedAt: 1700000000000 });
    await renderRouter(routes, { initialUrl: '/sign-in' });

    await fireEvent.changeText(screen.getByLabelText('Email'), 'Ada@Example.com');
    await fireEvent.press(screen.getByRole('button', { name: 'Send code' }));

    expect(screen).toHavePathname('/verify');
    expect(screen).toHaveSearchParams({ email: 'ada@example.com', sentAt: '1700000000000' });
    expect(screen.getByText('ada@example.com')).toBeOnTheScreen();
  });

  it('goes back to Sign In with the typed address still in the field', async () => {
    sendCode.mockResolvedValue({ ok: true, email: 'ada@example.com', requestedAt: 1700000000000 });
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await fireEvent.changeText(screen.getByLabelText('Email'), 'ada@exmaple.com');
    await fireEvent.press(screen.getByRole('button', { name: 'Send code' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Use a different email' }));

    expect(screen).toHavePathname('/sign-in');
    expect(screen.getByLabelText('Email').props.value).toBe('ada@exmaple.com');
  });

  it('opens Sign In with the address filled in when Verify Code was opened directly', async () => {
    await renderRouter(routes, {
      initialUrl: '/verify?email=ada%40example.com&sentAt=1700000000000',
    });
    expect(screen).toHavePathname('/verify');

    await fireEvent.press(screen.getByRole('button', { name: 'Use a different email' }));

    expect(screen).toHavePathname('/sign-in');
    expect(screen.getByLabelText('Email').props.value).toBe('ada@example.com');
  });

  it.each([
    '/verify',
    '/verify?email=ada%40example.com',
    '/verify?email=ada%40example.com&sentAt=soon',
  ])('sends %s, which has no code to check, to Sign In', async (url) => {
    await renderRouter(routes, { initialUrl: url });

    expect(screen).toHavePathname('/sign-in');
  });
});
