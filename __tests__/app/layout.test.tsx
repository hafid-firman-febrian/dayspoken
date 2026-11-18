import type { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import * as SplashScreen from 'expo-splash-screen';

import NotFoundRoute from '../../app/+not-found';
import GalleryRoute from '../../app/dev/gallery';
import IndexScreen from '../../app/index';
import RootLayout from '../../app/_layout';
import * as AuthLayout from '../../app/(auth)/_layout';
import SignInRoute from '../../app/(auth)/sign-in';
import VerifyRoute from '../../app/(auth)/verify';
import WelcomeRoute from '../../app/(auth)/welcome';

// The root layout imports the NativeWind style sheet, which Jest cannot parse.
jest.mock('../../src/theme/global.css', () => ({}));

// A stand-in for the Supabase client: it lets a test decide what is saved and when the sign-in
// state changes, and sign out removes the session the way the real client does.
type Listener = (event: string, session: Session | null) => void;
let mockSession: Session | null = null;
let mockRead: Promise<void> | undefined;
let mockListener: Listener | undefined;
const mockAuth = {
  onAuthStateChange: jest.fn((callback: Listener) => {
    mockListener = callback;
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  }),
  getSession: jest.fn(async () => {
    await mockRead;
    return { data: { session: mockSession } };
  }),
  signOut: jest.fn(async () => {
    mockSession = null;
    mockListener?.('SIGNED_OUT', null);
    return { error: null };
  }),
};
jest.mock('@/lib/supabase', () => ({
  getSupabase: () => ({ auth: mockAuth }),
  startSessionRefresh: jest.fn(() => () => undefined),
}));

const SESSION = { access_token: 'access', user: { id: 'user-1' } } as unknown as Session;
const hideAsync = SplashScreen.hideAsync as jest.Mock;

const setDev = (value: boolean) => {
  (globalThis as unknown as { __DEV__: boolean }).__DEV__ = value;
};

const routes = {
  _layout: RootLayout,
  index: IndexScreen,
  '(auth)/_layout': AuthLayout,
  '(auth)/welcome': WelcomeRoute,
  '(auth)/sign-in': SignInRoute,
  '(auth)/verify': VerifyRoute,
  'dev/gallery': GalleryRoute,
  '+not-found': NotFoundRoute,
};

const open = (initialUrl = '/') => renderRouter(routes, { initialUrl });

describe('the route guard', () => {
  const originalDev = (globalThis as unknown as { __DEV__: boolean }).__DEV__;

  beforeEach(() => {
    mockSession = null;
    mockRead = undefined;
    mockListener = undefined;
    hideAsync.mockClear();
    mockAuth.signOut.mockClear();
    setDev(true);
  });
  afterEach(() => setDev(originalDev));

  describe('signed out', () => {
    it('opens on Welcome', async () => {
      await open();
      expect(screen).toHavePathname('/welcome');
    });

    it('sends a link to a signed-in route to Welcome, and never renders that screen', async () => {
      await open('/');
      expect(screen).toHavePathname('/welcome');
      expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
    });

    it('lets the user move between Welcome, Sign In, and Verify Code', async () => {
      await open('/welcome');
      await act(() => router.push('/sign-in'));
      expect(screen).toHavePathname('/sign-in');

      await act(() => router.push('/verify'));
      expect(screen).toHavePathname('/verify');
    });

    it('opens the Sign In route directly', async () => {
      await open('/sign-in');
      expect(screen).toHavePathname('/sign-in');
    });
  });

  describe('signed in', () => {
    beforeEach(() => {
      mockSession = SESSION;
    });

    it('opens on the signed-in home, with no frame of Welcome', async () => {
      await open();
      expect(screen).toHavePathname('/');
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeOnTheScreen();
    });

    it.each(['/welcome', '/sign-in', '/verify'])(
      'sends a link to %s to the home route',
      async (url) => {
        await open(url);
        expect(screen).toHavePathname('/');
        expect(screen.getByRole('button', { name: 'Sign out' })).toBeOnTheScreen();
      },
    );
  });

  describe('while the saved session is read', () => {
    it('renders no route and keeps the splash screen up, then shows the right screen', async () => {
      let finish!: () => void;
      mockSession = SESSION;
      mockRead = new Promise<void>((resolve) => (finish = resolve));

      await open();
      expect(screen.queryByTestId('screen')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
      expect(hideAsync).not.toHaveBeenCalled();

      await act(async () => finish());

      expect(screen).toHavePathname('/');
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeOnTheScreen();
      expect(hideAsync).toHaveBeenCalledTimes(1);
    });

    it('opens on Welcome, not on the splash screen, when reading the session fails', async () => {
      mockAuth.getSession.mockRejectedValueOnce(new Error('storage broke'));

      await open();

      expect(screen).toHavePathname('/welcome');
      expect(hideAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the sign-in state changes', () => {
    it('moves to the home route after a sign-in, with no way back to the auth screens', async () => {
      await open('/welcome');
      await act(() => router.push('/sign-in'));
      await act(() => router.push('/verify'));

      await act(async () => mockListener?.('SIGNED_IN', SESSION));

      expect(screen).toHavePathname('/');
      expect(router.canGoBack()).toBe(false);
    });

    it('moves to Welcome when the session ends on its own', async () => {
      mockSession = SESSION;
      await open();
      expect(screen).toHavePathname('/');

      await act(async () => mockListener?.('SIGNED_OUT', null));

      expect(screen).toHavePathname('/welcome');
    });

    it('signs out from the home screen to Welcome, and back reaches no signed-in screen', async () => {
      mockSession = SESSION;
      await open();

      await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));

      expect(mockAuth.signOut).toHaveBeenCalledWith({ scope: 'local' });
      expect(screen).toHavePathname('/welcome');
      expect(router.canGoBack()).toBe(false);
      expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
    });
  });

  describe('the development gallery', () => {
    it('opens while signed out in a development build', async () => {
      await open('/dev/gallery');
      expect(screen).toHavePathname('/dev/gallery');
      expect(screen.getByText('Components')).toBeOnTheScreen();
    });

    it('opens while signed in in a development build', async () => {
      mockSession = SESSION;
      await open('/dev/gallery');
      expect(screen).toHavePathname('/dev/gallery');
    });

    it('is not shown in a production build: a signed-out visitor ends on Welcome', async () => {
      setDev(false);
      await open('/dev/gallery');
      expect(screen).toHavePathname('/welcome');
      expect(screen.queryByText('Components')).toBeNull();
    });

    it('is not shown in a production build: a signed-in user ends on the home route', async () => {
      setDev(false);
      mockSession = SESSION;
      await open('/dev/gallery');
      expect(screen).toHavePathname('/');
      expect(screen.queryByText('Components')).toBeNull();
    });
  });
});
