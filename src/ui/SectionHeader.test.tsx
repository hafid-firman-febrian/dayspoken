import { fireEvent, screen } from '@testing-library/react-native';

import { SectionHeader } from './SectionHeader';
import { renderWithProviders, SCHEMES } from './test-utils';

describe.each(SCHEMES)('SectionHeader (%s mode)', (scheme) => {
  it('shows its title as a header', async () => {
    await renderWithProviders(<SectionHeader title="Recent" />, { scheme });
    expect(screen.getByRole('header', { name: 'Recent' })).toBeOnTheScreen();
  });

  it('is a header in the small size too', async () => {
    await renderWithProviders(<SectionHeader title="Today" size="sm" />, { scheme });
    expect(screen.getByRole('header', { name: 'Today' })).toBeOnTheScreen();
  });
});

describe('SectionHeader styling', () => {
  it('uses the heading style, and a quiet muted caption in the small size', async () => {
    await renderWithProviders(
      <>
        <SectionHeader title="Large" />
        <SectionHeader title="Small" size="sm" />
      </>,
    );
    expect(screen.getByText('Large').props.className.split(' ')).toContain('text-heading');
    const small = screen.getByText('Small').props.className.split(' ');
    expect(small).toEqual(expect.arrayContaining(['text-caption', 'text-muted']));
  });

  it('has an opaque background fill, so a sticky header hides what scrolls behind it', async () => {
    await renderWithProviders(<SectionHeader title="Recent" testID="header" />);
    expect(screen.getByTestId('header').props.className.split(' ')).toContain('bg-background');
  });
});

describe('SectionHeader action', () => {
  it('calls back when the action is pressed', async () => {
    const onActionPress = jest.fn();
    await renderWithProviders(
      <SectionHeader title="Recent" actionLabel="See all" onActionPress={onActionPress} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'See all' }));
    expect(onActionPress).toHaveBeenCalledTimes(1);
  });

  it('has no action by default', async () => {
    await renderWithProviders(<SectionHeader title="Recent" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows no action without a handler', async () => {
    await renderWithProviders(<SectionHeader title="Recent" actionLabel="See all" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
