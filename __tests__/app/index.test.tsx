import { fireEvent, screen } from '@testing-library/react-native';

import { useSignOut } from '@/features/auth';
import { renderWithProviders } from '@/ui/test-utils';

import IndexScreen from '../../app/index';

jest.mock('@/features/auth', () => ({ useSignOut: jest.fn() }));

const mockSignOut = jest.fn();
const mockUseSignOut = jest.mocked(useSignOut);

const setDev = (value: boolean) => {
  (globalThis as unknown as { __DEV__: boolean }).__DEV__ = value;
};

describe('IndexScreen', () => {
  const originalDev = (globalThis as unknown as { __DEV__: boolean }).__DEV__;
  beforeEach(() => {
    mockSignOut.mockClear();
    mockUseSignOut.mockReturnValue({ signOut: mockSignOut, isSigningOut: false });
  });
  afterEach(() => setDev(originalDev));

  it('has a temporary Sign out button that signs the user out', async () => {
    await renderWithProviders(<IndexScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('shows the Sign out button as busy, and ignores a press, while it works', async () => {
    mockUseSignOut.mockReturnValue({ signOut: mockSignOut, isSigningOut: true });
    await renderWithProviders(<IndexScreen />);

    const button = screen.getByRole('button', { name: 'Sign out', busy: true });
    expect(button).toBeOnTheScreen();
    await fireEvent.press(button);

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('shows the app name and the placeholder text', async () => {
    await renderWithProviders(<IndexScreen />);

    expect(screen.getByRole('header', { name: 'Dayspoken' })).toBeOnTheScreen();
    expect(screen.getByText('The development build is running.')).toBeOnTheScreen();
  });

  it('shows the app environment from the env module', async () => {
    await renderWithProviders(<IndexScreen />);

    expect(screen.getByText('Environment: development')).toBeOnTheScreen();
  });

  it('shows a link to the component gallery in a development build', async () => {
    setDev(true);
    await renderWithProviders(<IndexScreen />);

    expect(screen.getByRole('button', { name: 'Component gallery' })).toBeOnTheScreen();
  });

  it('shows no gallery link in a production build', async () => {
    setDev(false);
    await renderWithProviders(<IndexScreen />);

    expect(screen.queryByRole('button', { name: 'Component gallery' })).toBeNull();
    expect(screen.getByRole('header', { name: 'Dayspoken' })).toBeOnTheScreen();
  });
});
