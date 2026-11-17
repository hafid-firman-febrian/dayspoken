import { useEffect } from 'react';
import type { DimensionValue } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export type SkeletonShape = 'text' | 'card' | 'pill';

export type SkeletonProps = {
  /** `text` is a line, `card` has the card radius, `pill` is fully rounded. Default `text`. */
  shape?: SkeletonShape;
  width?: DimensionValue;
  height?: DimensionValue;
  testID?: string;
};

// Tailwind only generates classes it can read in the source: keep these literal.
const SHAPE_CLASS: Record<SkeletonShape, string> = {
  text: 'rounded-md',
  card: 'rounded-card',
  pill: 'rounded-full',
};

const DEFAULT_HEIGHT: Record<SkeletonShape, number> = { text: 12, card: 120, pill: 32 };

const PULSE_MS = 1000;
const PULSE_LOW = 0.5;

export function Skeleton({ shape = 'text', width = '100%', height, testID }: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  // A gentle pulse while content loads. With "reduce motion" on, it stays a static block.
  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(opacity);
      opacity.value = 1;
      return;
    }
    opacity.value = withRepeat(withTiming(PULSE_LOW, { duration: PULSE_MS }), -1, true);
    return () => cancelAnimation(opacity);
  }, [reduceMotion, opacity]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      testID={testID}
      // A placeholder says nothing: screen readers skip it.
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`bg-border ${SHAPE_CLASS[shape]}`}
      style={[{ width, height: height ?? DEFAULT_HEIGHT[shape] }, pulse]}
    />
  );
}
