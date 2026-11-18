import { formatCountdown } from './format-countdown';

describe('formatCountdown', () => {
  it.each([
    [60, '1:00'],
    [45, '0:45'],
    [9, '0:09'],
    [0, '0:00'],
    [125, '2:05'],
  ])('formats %p seconds as %p', (seconds, expected) => {
    expect(formatCountdown(seconds)).toBe(expected);
  });

  it('rounds a fraction up, so the timer never shows 0:00 before it is over', () => {
    expect(formatCountdown(0.2)).toBe('0:01');
  });

  it('never shows a negative time', () => {
    expect(formatCountdown(-3)).toBe('0:00');
  });
});
