import { Info, X, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from './Button';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { Text } from './Text';

export type BannerTone = 'neutral' | 'accent';

export type BannerProps = {
  message: string;
  /** `neutral` for status ("You're offline"), `accent` for something that needs attention. */
  tone?: BannerTone;
  icon?: LucideIcon;
  /** A text action on the right. Needs `onActionPress`. */
  actionLabel?: string;
  onActionPress?: () => void;
  /** Shows a close button, labeled "Dismiss". */
  onDismiss?: () => void;
  testID?: string;
};

// Tailwind only generates classes it can read in the source: keep these literal.
const TONE_CLASS: Record<BannerTone, string> = {
  neutral: 'border border-border',
  accent: 'border-2 border-accent',
};

/** An inline, full-width message with an icon. It does not move the content below it. */
export function Banner({
  message,
  tone = 'neutral',
  icon = Info,
  actionLabel,
  onActionPress,
  onDismiss,
  testID,
}: BannerProps) {
  return (
    <View
      testID={testID}
      className={`flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-3 ${TONE_CLASS[tone]}`}
    >
      {/* Only the message is the live region: the buttons stay separate, focusable items. */}
      <View
        testID="banner-message"
        accessible
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className="flex-1 flex-row items-center gap-3"
      >
        <Icon icon={icon} size={20} tone={tone === 'accent' ? 'accent' : 'muted'} />
        <Text variant="caption" className="flex-1">
          {message}
        </Text>
      </View>
      {actionLabel && onActionPress ? (
        <Button label={actionLabel} onPress={onActionPress} variant="ghost" size="sm" />
      ) : null}
      {onDismiss ? <IconButton icon={X} accessibilityLabel="Dismiss" onPress={onDismiss} /> : null}
    </View>
  );
}
