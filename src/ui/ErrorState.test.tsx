import { fireEvent, screen } from '@testing-library/react-native';

import { ErrorState } from './ErrorState';
import { renderWithProviders, SCHEMES } from './test-utils';

describe.each(SCHEMES)('ErrorState (%s mode)', (scheme) => {
  it('shows the default title and retry button', async () => {
    await renderWithProviders(<ErrorState onRetry={jest.fn()} />, { scheme });
    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen();
  });
});

describe('ErrorState content', () => {
  it('takes a custom title, message, and retry label', async () => {
    await renderWithProviders(
      <ErrorState
        title="Could not load entries"
        message="Check your connection."
        retryLabel="Reload"
        onRetry={jest.fn()}
      />,
    );
    expect(screen.getByText('Could not load entries')).toBeOnTheScreen();
    expect(screen.getByText('Check your connection.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeOnTheScreen();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('shows no message by default', async () => {
    await renderWithProviders(<ErrorState onRetry={jest.fn()} />);
    expect(screen.queryByText('Check your connection.')).toBeNull();
  });
});

describe('ErrorState retry', () => {
  it('calls onRetry once when the button is pressed', async () => {
    const onRetry = jest.fn();
    await renderWithProviders(<ErrorState onRetry={onRetry} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows loading and ignores presses while retrying', async () => {
    const onRetry = jest.fn();
    await renderWithProviders(<ErrorState onRetry={onRetry} retrying />);
    expect(screen.getByTestId('button-loading')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again', busy: true }));
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('shows no loading when it is not retrying', async () => {
    await renderWithProviders(<ErrorState onRetry={jest.fn()} />);
    expect(screen.queryByTestId('button-loading')).toBeNull();
  });
});

describe('ErrorState accessibility', () => {
  it('announces the error politely as an alert', async () => {
    await renderWithProviders(
      <ErrorState title="Could not load" message="Try later." onRetry={jest.fn()} />,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Could not load/);
    expect(alert).toHaveTextContent(/Try later\./);
    expect(alert.props.accessibilityLiveRegion).toBe('polite');
  });

  it('keeps the retry button focusable, outside the announced text', async () => {
    await renderWithProviders(<ErrorState onRetry={jest.fn()} />);
    expect(screen.getByRole('alert')).not.toContainElement(
      screen.getByRole('button', { name: 'Try again' }),
    );
  });

  it('announces its title as a header', async () => {
    await renderWithProviders(<ErrorState onRetry={jest.fn()} />);
    expect(screen.getByRole('header', { name: 'Something went wrong' })).toBeOnTheScreen();
  });
});
