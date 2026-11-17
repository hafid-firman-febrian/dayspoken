import { View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';

export type SectionHeaderProps = {
  title: string;
  /** `md` is a heading. `sm` is a quiet caption, for date groups in a list. */
  size?: 'md' | 'sm';
  /** A trailing text action, for example "See all". Needs `onActionPress`. */
  actionLabel?: string;
  onActionPress?: () => void;
  testID?: string;
};

// The fill is opaque on purpose: a sticky header must hide what scrolls behind it.
export function SectionHeader({
  title,
  size = 'md',
  actionLabel,
  onActionPress,
  testID,
}: SectionHeaderProps) {
  return (
    <View testID={testID} className="flex-row items-center justify-between bg-background py-2">
      {size === 'md' ? (
        <Text variant="heading">{title}</Text>
      ) : (
        <Text variant="caption" tone="muted" accessibilityRole="header">
          {title}
        </Text>
      )}
      {actionLabel && onActionPress ? (
        <Button label={actionLabel} onPress={onActionPress} variant="ghost" size="sm" />
      ) : null}
    </View>
  );
}
