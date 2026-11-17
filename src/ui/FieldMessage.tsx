import { CircleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from './Icon';
import { Text } from './Text';

type Props = {
  error?: string;
  helperText?: string;
  testID?: string;
};

/**
 * The message under a form field: an error (with an icon, announced to screen readers) or a
 * quiet helper line. An error replaces the helper text. Internal to src/ui.
 */
export function FieldMessage({ error, helperText, testID }: Props) {
  if (error) {
    return (
      <View
        testID={testID}
        // One accessibility element: the (hidden) icon plus the message read as a single alert.
        accessible
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className="flex-row items-center gap-1.5"
      >
        <Icon
          icon={CircleAlert}
          size={14}
          tone="accent"
          testID={testID ? `${testID}-icon` : undefined}
        />
        <Text variant="caption" tone="accent" className="flex-1">
          {error}
        </Text>
      </View>
    );
  }

  if (helperText) {
    return (
      <Text variant="caption" tone="muted" testID={testID}>
        {helperText}
      </Text>
    );
  }

  return null;
}
