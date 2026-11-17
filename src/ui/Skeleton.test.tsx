import { screen } from '@testing-library/react-native';
import { useReducedMotion, withRepeat } from 'react-native-reanimated';

import { Skeleton } from './Skeleton';
import { renderWithProviders, SCHEMES } from './test-utils';

// Reanimated's Jest mock resolves animations at once. Keep it, but make the two calls the
// Skeleton cares about observable.
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: jest.fn(() => false),
  withRepeat: jest.fn((animation: unknown) => animation),
}));

const mockReducedMotion = useReducedMotion as jest.Mock;
const mockWithRepeat = withRepeat as jest.Mock;

const shown = (testID: string) => screen.getByTestId(testID, { includeHiddenElements: true });

beforeEach(() => {
  mockReducedMotion.mockReturnValue(false);
  mockWithRepeat.mockClear();
});

describe.each(SCHEMES)('Skeleton (%s mode)', (scheme) => {
  it('renders a block', async () => {
    await renderWithProviders(<Skeleton testID="skeleton" />, { scheme });
    expect(shown('skeleton')).toBeOnTheScreen();
  });
});

describe('Skeleton shapes', () => {
  it.each([
    ['text', 'rounded-md', 12],
    ['card', 'rounded-card', 120],
    ['pill', 'rounded-full', 32],
  ] as const)('the %s shape uses %s and is %i high by default', async (shape, radius, height) => {
    await renderWithProviders(<Skeleton shape={shape} testID="skeleton" />);
    const element = shown('skeleton');
    expect(element.props.className.split(' ')).toEqual(
      expect.arrayContaining(['bg-border', radius]),
    );
    expect(element).toHaveStyle({ height });
  });

  it('takes a size', async () => {
    await renderWithProviders(<Skeleton width={160} height={20} testID="skeleton" />);
    expect(shown('skeleton')).toHaveStyle({ width: 160, height: 20 });
  });

  it('fills the width by default', async () => {
    await renderWithProviders(<Skeleton testID="skeleton" />);
    expect(shown('skeleton')).toHaveStyle({ width: '100%' });
  });
});

describe('Skeleton accessibility', () => {
  it('is hidden from screen readers', async () => {
    await renderWithProviders(<Skeleton testID="skeleton" />);
    expect(screen.queryByTestId('skeleton')).toBeNull();
    expect(shown('skeleton').props.importantForAccessibility).toBe('no-hide-descendants');
  });
});

describe('Skeleton motion', () => {
  it('pulses forever, back and forth, over one second', async () => {
    await renderWithProviders(<Skeleton testID="skeleton" />);
    expect(mockWithRepeat).toHaveBeenCalledTimes(1);
    const [, repeats, reverse] = mockWithRepeat.mock.calls[0];
    expect(repeats).toBe(-1);
    expect(reverse).toBe(true);
  });

  it('stays a static block when reduce motion is on', async () => {
    mockReducedMotion.mockReturnValue(true);
    await renderWithProviders(<Skeleton testID="skeleton" />);
    expect(mockWithRepeat).not.toHaveBeenCalled();
    expect(shown('skeleton')).toBeOnTheScreen();
  });
});
