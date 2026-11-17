import { fireEvent, screen } from '@testing-library/react-native';
import { Filter } from 'lucide-react-native';

import { MOOD_SCALE } from '@/theme';

import { Chip } from './Chip';
import { renderWithProviders, SCHEMES } from './test-utils';

const classesOf = (testID: string, hidden = false): string[] =>
  screen.getByTestId(testID, { includeHiddenElements: hidden }).props.className.split(' ');

describe.each(SCHEMES)('Chip (%s mode)', (scheme) => {
  it('shows its label', async () => {
    await renderWithProviders(<Chip label="Work" />, { scheme });
    expect(screen.getByText('Work')).toBeOnTheScreen();
  });
});

describe('Chip with a color dot', () => {
  it('shows the dot and the label together, and reads as the label', async () => {
    const { label } = MOOD_SCALE[2];
    await renderWithProviders(<Chip label={label} dot="mood-2" testID="chip" />);
    expect(screen.getByText('Low')).toBeOnTheScreen();
    expect(classesOf('chip-dot', true)).toContain('bg-mood-2');
    expect(screen.getByLabelText('Low')).toBeOnTheScreen();
  });

  it('hides the dot from screen readers, so the label is all they read', async () => {
    await renderWithProviders(<Chip label="Low" dot="mood-2" testID="chip" />);
    expect(screen.queryByTestId('chip-dot')).toBeNull();
  });

  it.each([1, 2, 3, 4, 5] as const)(
    'draws the mood level %i dot in its token color',
    async (level) => {
      const { label, colorToken } = MOOD_SCALE[level];
      await renderWithProviders(<Chip label={label} dot={colorToken} testID="chip" />);
      expect(classesOf('chip-dot', true)).toContain(`bg-${colorToken}`);
    },
  );

  it('never uses a mood color for the label text', async () => {
    await renderWithProviders(<Chip label="Low" dot="mood-2" />);
    const labelClasses = screen.getByText('Low').props.className.split(' ');
    expect(labelClasses.some((name: string) => name.includes('mood'))).toBe(false);
    expect(labelClasses).toContain('text-foreground');
  });

  it('has no dot when none is given', async () => {
    await renderWithProviders(<Chip label="Work" testID="chip" />);
    expect(screen.queryByTestId('chip-dot', { includeHiddenElements: true })).toBeNull();
  });
});

describe('Chip as a filter', () => {
  it('is not a button when it is not selectable', async () => {
    await renderWithProviders(<Chip label="Work" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('reports true when an unselected chip is pressed', async () => {
    const onSelectedChange = jest.fn();
    await renderWithProviders(<Chip label="Work" onSelectedChange={onSelectedChange} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Work' }));
    expect(onSelectedChange).toHaveBeenCalledTimes(1);
    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  it('reports false when a selected chip is pressed', async () => {
    const onSelectedChange = jest.fn();
    await renderWithProviders(<Chip label="Work" selected onSelectedChange={onSelectedChange} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Work' }));
    expect(onSelectedChange).toHaveBeenCalledWith(false);
  });

  it('is announced as selected only when it is selected', async () => {
    await renderWithProviders(
      <>
        <Chip label="On" selected onSelectedChange={jest.fn()} />
        <Chip label="Off" onSelectedChange={jest.fn()} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'On', selected: true })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Off', selected: false })).toBeOnTheScreen();
  });

  it('inverts to a foreground fill with background text when selected', async () => {
    await renderWithProviders(
      <Chip label="Work" selected onSelectedChange={jest.fn()} testID="chip" />,
    );
    expect(classesOf('chip')).toContain('bg-foreground');
    expect(screen.getByText('Work').props.className.split(' ')).toContain('text-background');
  });

  it('is a surface with a border when not selected', async () => {
    await renderWithProviders(<Chip label="Work" onSelectedChange={jest.fn()} testID="chip" />);
    expect(classesOf('chip')).toEqual(expect.arrayContaining(['bg-surface', 'border-border']));
  });

  it('reaches a 44pt touch target: 32 high plus a 6pt hit area on each side', async () => {
    await renderWithProviders(<Chip label="Work" onSelectedChange={jest.fn()} testID="chip" />);
    expect(classesOf('chip')).toContain('h-8');
    expect(screen.getByTestId('chip').props.hitSlop).toEqual({
      top: 6,
      bottom: 6,
      left: 6,
      right: 6,
    });
  });

  it('is a pill', async () => {
    await renderWithProviders(<Chip label="Work" testID="chip" />);
    expect(classesOf('chip')).toContain('rounded-full');
  });

  it('can show a leading icon', async () => {
    await renderWithProviders(<Chip label="Filters" icon={Filter} testID="chip" />);
    expect(screen.getByText('Filters')).toBeOnTheScreen();
  });
});
