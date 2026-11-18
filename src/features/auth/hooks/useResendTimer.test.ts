import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { RESEND_SECONDS } from '../types';
import { useResendTimer } from './useResendTimer';

const START = 1_700_000_000_000;

describe('useResendTimer', () => {
  let onAppStateChange: ((state: string) => void) | undefined;
  const remove = jest.fn();

  let setIntervalSpy: jest.SpyInstance;
  let clearIntervalSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers({ now: START });
    // Counting timers with jest.getTimerCount() also counts the test library's own, so the
    // interval this hook starts and stops is watched directly.
    setIntervalSpy = jest.spyOn(globalThis, 'setInterval');
    clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval');
    onAppStateChange = undefined;
    remove.mockClear();
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _type: string,
      handler: (state: string) => void,
    ) => {
      onAppStateChange = handler;
      return { remove };
    }) as unknown as typeof AppState.addEventListener);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const advance = (seconds: number) =>
    act(async () => {
      jest.advanceTimersByTime(seconds * 1000);
    });

  it('starts with the whole interval left and no resend yet', async () => {
    const { result } = await renderHook(() => useResendTimer(START));
    expect(result.current).toEqual({ secondsLeft: RESEND_SECONDS, canResend: false });
  });

  it('counts down with the clock', async () => {
    const { result } = await renderHook(() => useResendTimer(START));

    await advance(15);
    expect(result.current.secondsLeft).toBe(45);

    await advance(44);
    expect(result.current).toEqual({ secondsLeft: 1, canResend: false });
  });

  it('allows a resend at zero, and stops its timer', async () => {
    const { result } = await renderHook(() => useResendTimer(START));

    await advance(RESEND_SECONDS);

    expect(result.current).toEqual({ secondsLeft: 0, canResend: true });
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(clearIntervalSpy).toHaveBeenCalledWith(setIntervalSpy.mock.results[0].value);
  });

  it('is ready at once, with no timer, when the time is already up', async () => {
    const { result } = await renderHook(() => useResendTimer(START - 90_000));

    expect(result.current).toEqual({ secondsLeft: 0, canResend: true });
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it('restarts from the full interval when a new code is sent', async () => {
    const { result, rerender } = await renderHook(
      ({ sentAt }: { sentAt: number }) => useResendTimer(sentAt),
      { initialProps: { sentAt: START } },
    );
    await advance(RESEND_SECONDS);
    expect(result.current.canResend).toBe(true);

    await rerender({ sentAt: Date.now() });

    expect(result.current).toEqual({ secondsLeft: RESEND_SECONDS, canResend: false });
    await advance(10);
    expect(result.current.secondsLeft).toBe(RESEND_SECONDS - 10);
  });

  it('is right after the app was in the background, where no timer ticked', async () => {
    const { result } = await renderHook(() => useResendTimer(START));

    // The clock moves 50 seconds while no timer runs, then the app comes back.
    jest.setSystemTime(START + 50_000);
    await act(async () => onAppStateChange?.('active'));

    expect(result.current.secondsLeft).toBe(10);
  });

  it('is ready after a long time in the background', async () => {
    const { result } = await renderHook(() => useResendTimer(START));

    jest.setSystemTime(START + 5 * 60_000);
    await act(async () => onAppStateChange?.('active'));

    expect(result.current).toEqual({ secondsLeft: 0, canResend: true });
  });

  it('stops its timer and its listener when it unmounts', async () => {
    const { unmount } = await renderHook(() => useResendTimer(START));
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    const interval = setIntervalSpy.mock.results[0].value;
    clearIntervalSpy.mockClear();

    await unmount();

    expect(clearIntervalSpy).toHaveBeenCalledWith(interval);
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
