import { CircleAlert, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

export type ErrorStateProps = {
  /** Default "Something went wrong". */
  title?: string;
  message?: string;
  /** Default "Try again". */
  retryLabel?: string;
  onRetry: () => void;
  /** The retry is running: the button shows a spinner and ignores presses. */
  retrying?: boolean;
  icon?: LucideIcon;
  testID?: string;
};

/** Something failed: say what, and offer the retry. Used for a whole screen or one section. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  retryLabel = 'Try again',
  onRetry,
  retrying = false,
  icon = CircleAlert,
  testID,
}: ErrorStateProps) {
  return (
    <View testID={testID} className="items-center justify-center gap-3 px-6 py-10">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-surface">
        <Icon icon={icon} size={28} tone="accent" />
      </View>
      {/* Only the text is the live region: wrapping the button would hide it from screen readers. */}
      <View
        testID="error-state-message"
        accessible
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className="items-center gap-1"
      >
        <Text variant="heading" className="text-center">
          {title}
        </Text>
        {message ? (
          <Text tone="muted" className="text-center">
            {message}
          </Text>
        ) : null}
      </View>
      <View className="pt-2">
        <Button label={retryLabel} onPress={onRetry} loading={retrying} variant="secondary" />
      </View>
    </View>
  );
}
