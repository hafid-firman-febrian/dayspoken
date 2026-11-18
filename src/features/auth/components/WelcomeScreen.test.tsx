import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders, SCHEMES } from '@/ui/test-utils';

import * as api from '../api';
import { PRIVACY_NOTICE, WelcomeScreen } from './WelcomeScreen';

jest.mock('../api');

describe.each(SCHEMES)('WelcomeScreen (%s)', (scheme) => {
  const render = (onGetStarted = jest.fn()) =>
    renderWithProviders(<WelcomeScreen onGetStarted={onGetStarted} />, { scheme });

  it('shows the app name, the value proposition, and both buttons', async () => {
    await render();

    expect(screen.getByText('Dayspoken')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: /Talk for a minute/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Get started' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Try the demo' })).toBeOnTheScreen();
  });

  it('opens Sign In with Get started', async () => {
    const onGetStarted = jest.fn();
    await render(onGetStarted);

    await fireEvent.press(screen.getByRole('button', { name: 'Get started' }));

    expect(onGetStarted).toHaveBeenCalledTimes(1);
  });

  it('shows the privacy notice with no press, next to the buttons', async () => {
    await render();

    expect(screen.getByText(PRIVACY_NOTICE)).toBeOnTheScreen();
    expect(PRIVACY_NOTICE).toBe(
      "This demo processes audio with Google Gemini's free tier. Avoid recording sensitive information.",
    );
  });

  it('puts the screen content outside a scroll view, so nothing needs scrolling to be seen', async () => {
    await render();

    expect(screen.queryByTestId('screen-scroll')).toBeNull();
    expect(screen.getByTestId('screen-content')).toBeOnTheScreen();
  });

  it('only says the demo is coming soon: no request, no navigation, still on Welcome', async () => {
    const onGetStarted = jest.fn();
    await render(onGetStarted);

    await fireEvent.press(screen.getByRole('button', { name: 'Try the demo' }));

    expect(screen.getByText('The demo is coming soon.')).toBeOnTheScreen();
    expect(onGetStarted).not.toHaveBeenCalled();
    expect(api.sendCode).not.toHaveBeenCalled();
    expect(api.verifyCode).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Get started' })).toBeOnTheScreen();
  });
});
