import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from './Button';
import { Text } from './Text';

export type ToastOptions = {
  /** A text action on the toast, for example "Undo". Needs `onAction`. */
  actionLabel?: string;
  onAction?: () => void;
  /** Milliseconds on screen. Default 4000, or 6000 when there is an action. */
  duration?: number;
};

type ToastItem = ToastOptions & { id: number; message: string };

type ToastApi = {
  /** Shows a short message. Messages shown in quick succession appear one at a time. */
  show: (message: string, options?: ToastOptions) => void;
};

const DEFAULT_DURATION = 4000;
const DEFAULT_DURATION_WITH_ACTION = 6000;

type QueueState = { current: ToastItem | null; queue: ToastItem[] };
type QueueAction = { type: 'show'; item: ToastItem } | { type: 'hide' };

// One state holds the visible toast and the ones waiting. Moving on to the next toast happens
// here, in the reducer, so no effect has to set state.
function queueReducer(state: QueueState, action: QueueAction): QueueState {
  if (action.type === 'show') {
    return state.current === null
      ? { current: action.item, queue: state.queue }
      : { current: state.current, queue: [...state.queue, action.item] };
  }
  const [next = null, ...rest] = state.queue;
  return { current: next, queue: rest };
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (api === null) {
    throw new Error('useToast must be used inside ToastProvider (see app/_layout.tsx).');
  }
  return api;
}

/**
 * Mount once, inside the theme. It renders the toast on top of everything below the status
 * bar, one at a time: a second toast waits for the first to hide.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [{ current }, dispatch] = useReducer(queueReducer, { current: null, queue: [] });
  const nextId = useRef(0);

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    dispatch({ type: 'show', item: { id: nextId.current++, message, ...options } });
  }, []);

  // The visible toast announces itself and hides itself.
  useEffect(() => {
    if (current === null) {
      return;
    }
    if (Platform.OS === 'ios') {
      // Android announces through the live region below. iOS needs this call.
      AccessibilityInfo.announceForAccessibility(current.message);
    }
    const duration =
      current.duration ?? (current.actionLabel ? DEFAULT_DURATION_WITH_ACTION : DEFAULT_DURATION);
    const timer = setTimeout(() => dispatch({ type: 'hide' }), duration);
    return () => clearTimeout(timer);
  }, [current]);

  const api = useMemo<ToastApi>(() => ({ show }), [show]);

  const pressAction = () => {
    current?.onAction?.();
    dispatch({ type: 'hide' });
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {current ? (
        <View
          pointerEvents="box-none"
          className="absolute inset-x-0 top-0 px-gutter"
          // Below the status bar, never over it.
          style={{ paddingTop: insets.top + 8 }}
        >
          <Animated.View
            key={current.id}
            testID="toast"
            entering={FadeIn}
            exiting={FadeOut}
            className="flex-row items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
            style={{ elevation: 4 }}
          >
            {/* Only the message is the live region: the action stays a separate, focusable item. */}
            <View
              testID="toast-message"
              accessible
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              className="flex-1"
            >
              <Text>{current.message}</Text>
            </View>
            {current.actionLabel && current.onAction ? (
              <Button label={current.actionLabel} onPress={pressAction} variant="ghost" size="sm" />
            ) : null}
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}
