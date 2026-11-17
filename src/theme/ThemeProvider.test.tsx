import { act, render, screen } from '@testing-library/react-native';
import { colorScheme as nativewindColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Text } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import { ThemeProvider } from './ThemeProvider';
import { ThemeScope } from './ThemeScope';
import { useTheme } from './theme-context';
import { useThemeModeStore } from './theme-mode-store';
import { colors } from './tokens';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('expo-system-ui', () => ({
  setBackgroundColorAsync: jest.fn().mockResolvedValue(true),
}));

// Keep NativeWind's real `vars`, but watch the call that sets the native appearance.
jest.mock('nativewind', () => ({
  ...jest.requireActual('nativewind'),
  colorScheme: { set: jest.fn() },
}));

const mockDeviceScheme = jest.requireMock('react-native/Libraries/Utilities/useColorScheme')
  .default as jest.Mock;
const setBackground = SystemUI.setBackgroundColorAsync as jest.Mock;
const setNativeAppearance = nativewindColorScheme.set as jest.Mock;

function Probe({ id }: { id: string }) {
  const { scheme, colors: current } = useTheme();
  return <Text testID={id}>{`${scheme}|${current.background}`}</Text>;
}

const expected = (scheme: 'light' | 'dark') => `${scheme}|${colors[scheme].background}`;

beforeEach(() => {
  mockDeviceScheme.mockReturnValue('light');
  useThemeModeStore.setState({ mode: 'system' });
  setBackground.mockClear();
  setNativeAppearance.mockClear();
});

describe('ThemeProvider', () => {
  it('gives dark colors to useTheme when the mode is dark', async () => {
    useThemeModeStore.setState({ mode: 'dark' });
    await render(
      <ThemeProvider>
        <Probe id="probe" />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(expected('dark'));
  });

  it('follows a dark device in system mode', async () => {
    mockDeviceScheme.mockReturnValue('dark');
    await render(
      <ThemeProvider>
        <Probe id="probe" />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(expected('dark'));
  });

  it('switches when the device appearance changes, without remounting', async () => {
    let mounts = 0;
    function MountCounter() {
      useEffect(() => {
        mounts += 1;
      }, []);
      return null;
    }
    // A new element each time: re-rendering the very same element object would be skipped.
    const makeTree = () => (
      <ThemeProvider>
        <MountCounter />
        <Probe id="probe" />
      </ThemeProvider>
    );

    await render(makeTree());
    expect(screen.getByTestId('probe')).toHaveTextContent(expected('light'));

    mockDeviceScheme.mockReturnValue('dark');
    await screen.rerender(makeTree());

    expect(screen.getByTestId('probe')).toHaveTextContent(expected('dark'));
    expect(mounts).toBe(1);
  });

  it('stays light in light mode when the device is dark', async () => {
    mockDeviceScheme.mockReturnValue('dark');
    useThemeModeStore.setState({ mode: 'light' });
    await render(
      <ThemeProvider>
        <Probe id="probe" />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(expected('light'));
  });

  it('goes dark, then back to following the device', async () => {
    await render(
      <ThemeProvider>
        <Probe id="probe" />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(expected('light'));

    await act(async () => useThemeModeStore.getState().setMode('dark'));
    expect(screen.getByTestId('probe')).toHaveTextContent(expected('dark'));

    await act(async () => useThemeModeStore.getState().setMode('system'));
    expect(screen.getByTestId('probe')).toHaveTextContent(expected('light'));
  });

  it('sets the native root background to the background token of the scheme', async () => {
    useThemeModeStore.setState({ mode: 'dark' });
    await render(
      <ThemeProvider>
        <Probe id="probe" />
      </ThemeProvider>,
    );
    expect(setBackground).toHaveBeenLastCalledWith(colors.dark.background);

    await act(async () => useThemeModeStore.getState().setMode('light'));
    expect(setBackground).toHaveBeenLastCalledWith(colors.light.background);
  });

  it('sets the native appearance to the chosen mode, and clears it for system', async () => {
    useThemeModeStore.setState({ mode: 'dark' });
    await render(
      <ThemeProvider>
        <Probe id="probe" />
      </ThemeProvider>,
    );
    expect(setNativeAppearance).toHaveBeenLastCalledWith('dark');

    await act(async () => useThemeModeStore.getState().setMode('system'));
    expect(setNativeAppearance).toHaveBeenLastCalledWith('system');
  });
});

describe('ThemeScope', () => {
  it('forces dark colors for its children only', async () => {
    await render(
      <ThemeProvider>
        <Probe id="outside" />
        <ThemeScope scheme="dark">
          <Probe id="inside" />
        </ThemeScope>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('outside')).toHaveTextContent(expected('light'));
    expect(screen.getByTestId('inside')).toHaveTextContent(expected('dark'));
  });
});

describe('useTheme', () => {
  it('explains the problem when there is no provider', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<Probe id="probe" />)).rejects.toThrow(/inside ThemeProvider/);
    consoleError.mockRestore();
  });
});
