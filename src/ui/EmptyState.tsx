import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  message?: string;
  /** A button under the text, for example "Record your first entry". Needs `onActionPress`. */
  actionLabel?: string;
  onActionPress?: () => void;
  testID?: string;
};

/** Nothing to show yet: an icon, a title, a short message, and the next step. */
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onActionPress,
  testID,
}: EmptyStateProps) {
  return (
    <View testID={testID} className="items-center justify-center gap-3 px-6 py-10">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-surface">
        <Icon icon={icon} size={28} tone="muted" />
      </View>
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      {message ? (
        <Text tone="muted" className="text-center">
          {message}
        </Text>
      ) : null}
      {actionLabel && onActionPress ? (
        <View className="pt-2">
          <Button label={actionLabel} onPress={onActionPress} />
        </View>
      ) : null}
    </View>
  );
}
