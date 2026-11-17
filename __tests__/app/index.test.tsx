import { render, screen } from '@testing-library/react-native';

import IndexScreen from '../../app/index';

describe('IndexScreen', () => {
  it('shows the app name and the placeholder text', async () => {
    await render(<IndexScreen />);

    expect(screen.getByRole('header', { name: 'Dayspoken' })).toBeOnTheScreen();
    expect(screen.getByText('The development build is running.')).toBeOnTheScreen();
  });
});
