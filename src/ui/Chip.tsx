import type { LucideIcon } from 'lucide-react-native';
import { Pressable, Text as NativeText, View } from 'react-native';

import type { MoodColorToken } from '@/theme';

import { Icon } from './Icon';

export type ChipProps = {
  /** The visible text. A chip always has one: a color alone never carries meaning. */
  label: string;
  /** A Lucide icon shown before the label. */
  icon?: LucideIcon;
  /** A color dot before the label, for example `mood-2`. Decorative: the label says it. */
  dot?: MoodColorToken;
  /** Pass `onSelectedChange` to make the chip selectable (a filter chip). */
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  className?: string;
  testID?: string;
};

// Tailwind only generates classes it can read in the source: keep these literal.
const DOT_CLASS: Record<MoodColorToken, string> = {
  'mood-1': 'bg-mood-1',
  'mood-2': 'bg-mood-2',
  'mood-3': 'bg-mood-3',
  'mood-4': 'bg-mood-4',
  'mood-5': 'bg-mood-5',
};

// A chip is 32pt high. The extra hit area brings the touch target of a selectable chip to 44.
const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

export function Chip({
  label,
  icon,
  dot,
  selected = false,
  onSelectedChange,
  className,
  testID,
}: ChipProps) {
  const selectable = onSelectedChange !== undefined;

  // Selected is a mono inversion: foreground fill, background text.
  const classes = [
    'h-8 flex-row items-center gap-1.5 self-start rounded-full px-3',
    selected ? 'bg-foreground' : 'bg-surface border border-border',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {dot ? (
        <View
          testID={testID ? `${testID}-dot` : undefined}
          aria-hidden
          className={`h-2 w-2 rounded-full ${DOT_CLASS[dot]}`}
        />
      ) : null}
      {icon ? <Icon icon={icon} size={14} tone={selected ? 'background' : 'foreground'} /> : null}
      <NativeText
        className={`font-geist-medium text-caption ${selected ? 'text-background' : 'text-foreground'}`}
      >
        {label}
      </NativeText>
    </>
  );

  if (selectable) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        hitSlop={HIT_SLOP}
        onPress={() => onSelectedChange(!selected)}
        className={classes}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View testID={testID} accessible accessibilityLabel={label} className={classes}>
      {content}
    </View>
  );
}
