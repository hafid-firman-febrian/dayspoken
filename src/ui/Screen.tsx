import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Edge = 'top' | 'bottom' | 'left' | 'right';

export type ScreenProps = {
  children?: ReactNode;
  /** Scroll the content. Taps keep working while the keyboard is open. */
  scroll?: boolean;
  /** Inset the content by the 20pt screen gutter. Default true. */
  padded?: boolean;
  /**
   * Which safe-area edges to respect. Default: top, left, right. The floating tab bar owns
   * the bottom, so a screen opts in to `bottom` only when there is no tab bar.
   */
  edges?: readonly Edge[];
};

const DEFAULT_EDGES: readonly Edge[] = ['top', 'left', 'right'];

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = DEFAULT_EDGES,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const inset = (edge: Edge) => (edges.includes(edge) ? insets[edge] : 0);

  const safeArea = {
    paddingTop: inset('top'),
    paddingBottom: inset('bottom'),
    paddingLeft: inset('left'),
    paddingRight: inset('right'),
  };

  return (
    <View testID="screen" className="flex-1 bg-background" style={safeArea}>
      {scroll ? (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            testID="screen-scroll"
            className="flex-1"
            contentContainerClassName={padded ? 'px-gutter' : undefined}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View testID="screen-content" className={padded ? 'flex-1 px-gutter' : 'flex-1'}>
          {children}
        </View>
      )}
    </View>
  );
}
