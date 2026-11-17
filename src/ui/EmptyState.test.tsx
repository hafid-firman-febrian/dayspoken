import { fireEvent, screen } from '@testing-library/react-native';
import { Inbox, type LucideIcon, type LucideProps } from 'lucide-react-native';
import { View } from 'react-native';

import { colors } from '@/theme';

import { EmptyState } from './EmptyState';
import { renderWithProviders, SCHEMES } from './test-utils';

describe.each(SCHEMES)('EmptyState (%s mode)', (scheme) => {
  it('shows its title', async () => {
    await renderWithProviders(<EmptyState icon={Inbox} title="No entries yet" />, { scheme });
    expect(screen.getByText('No entries yet')).toBeOnTheScreen();
  });

  it('draws the icon in the muted token', async () => {
    const calls: LucideProps[] = [];
    const Glyph = ((props: LucideProps) => {
      calls.push(props);
      return <View />;
    }) as unknown as LucideIcon;
    await renderWithProviders(<EmptyState icon={Glyph} title="No entries yet" />, { scheme });
    expect(calls[calls.length - 1].color).toBe(colors[scheme].muted);
  });
});

describe('EmptyState content', () => {
  it('announces its title as a header', async () => {
    await renderWithProviders(<EmptyState icon={Inbox} title="No entries yet" />);
    expect(screen.getByRole('header', { name: 'No entries yet' })).toBeOnTheScreen();
  });

  it('shows a message in the muted tone when it has one', async () => {
    await renderWithProviders(
      <EmptyState icon={Inbox} title="No entries yet" message="Record one to see it here." />,
    );
    const message = screen.getByText('Record one to see it here.');
    expect(message.props.className.split(' ')).toContain('text-muted');
  });

  it('centers its text', async () => {
    await renderWithProviders(
      <EmptyState icon={Inbox} title="No entries yet" message="Record one." />,
    );
    expect(screen.getByText('No entries yet').props.className.split(' ')).toContain('text-center');
    expect(screen.getByText('Record one.').props.className.split(' ')).toContain('text-center');
  });

  it('shows no message by default', async () => {
    await renderWithProviders(<EmptyState icon={Inbox} title="No entries yet" />);
    expect(screen.getAllByText(/./)).toHaveLength(1);
  });
});

describe('EmptyState action', () => {
  it('shows the action and calls back when it is pressed', async () => {
    const onActionPress = jest.fn();
    await renderWithProviders(
      <EmptyState
        icon={Inbox}
        title="No entries yet"
        actionLabel="Record your first entry"
        onActionPress={onActionPress}
      />,
    );
    expect(screen.getByText('No entries yet')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Record your first entry' }));
    expect(onActionPress).toHaveBeenCalledTimes(1);
  });

  it('has no button by default', async () => {
    await renderWithProviders(<EmptyState icon={Inbox} title="No entries yet" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows no button when there is a label but no handler', async () => {
    await renderWithProviders(
      <EmptyState icon={Inbox} title="No entries yet" actionLabel="Record" />,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});
