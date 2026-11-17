import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/ui/test-utils';

import IndexScreen from '../../app/index';

const setDev = (value: boolean) => {
  (globalThis as unknown as { __DEV__: boolean }).__DEV__ = value;
};

describe('IndexScreen', () => {
  const originalDev = (globalThis as unknown as { __DEV__: boolean }).__DEV__;
  afterEach(() => setDev(originalDev));

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
