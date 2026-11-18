import { renderHook } from '@testing-library/react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { GEIST_FONTS } from './fonts';
import { useAppFonts } from './use-app-fonts';

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockUseFonts = useFonts as jest.Mock;
const hideAsync = SplashScreen.hideAsync as jest.Mock;

beforeEach(() => {
  hideAsync.mockClear();
  hideAsync.mockResolvedValue(undefined);
});

describe('useAppFonts', () => {
  it('holds the splash screen from the moment the module loads', () => {
    expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalled();
  });

  it('asks expo-font to load the Geist weights', async () => {
    mockUseFonts.mockReturnValue([false, null]);
    await renderHook(() => useAppFonts());
    expect(mockUseFonts).toHaveBeenCalledWith(GEIST_FONTS);
  });

  it('is not ready and keeps the splash screen while the fonts load', async () => {
    mockUseFonts.mockReturnValue([false, null]);
    const { result } = await renderHook(() => useAppFonts());
    expect(result.current).toBe(false);
    expect(hideAsync).not.toHaveBeenCalled();
  });

  it('is ready and hides the splash screen once the fonts are loaded', async () => {
    mockUseFonts.mockReturnValue([true, null]);
    const { result } = await renderHook(() => useAppFonts());
    expect(result.current).toBe(true);
    expect(hideAsync).toHaveBeenCalledTimes(1);
  });

  it('is ready and hides the splash screen when loading fails, so the app still opens', async () => {
    mockUseFonts.mockReturnValue([false, new Error('font failed')]);
    const { result } = await renderHook(() => useAppFonts());
    expect(result.current).toBe(true);
    expect(hideAsync).toHaveBeenCalledTimes(1);
  });

  it('does not crash when hiding the splash screen fails', async () => {
    hideAsync.mockRejectedValue(new Error('already hidden'));
    mockUseFonts.mockReturnValue([true, null]);
    const { result } = await renderHook(() => useAppFonts());
    expect(result.current).toBe(true);
  });

  it('keeps the splash screen up while it is held, even when the fonts are ready', async () => {
    mockUseFonts.mockReturnValue([true, null]);
    const { result } = await renderHook(() => useAppFonts({ hold: true }));
    expect(result.current).toBe(true);
    expect(hideAsync).not.toHaveBeenCalled();
  });

  it('hides the splash screen once, when the hold is released', async () => {
    mockUseFonts.mockReturnValue([true, null]);
    const { rerender } = await renderHook(({ hold }: { hold: boolean }) => useAppFonts({ hold }), {
      initialProps: { hold: true },
    });
    expect(hideAsync).not.toHaveBeenCalled();

    await rerender({ hold: false });
    expect(hideAsync).toHaveBeenCalledTimes(1);
  });
});
