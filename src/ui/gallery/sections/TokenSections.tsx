import { View } from 'react-native';

import {
  MOOD_LEVELS,
  MOOD_SCALE,
  recordPalette,
  typography,
  useTheme,
  type TypeStyle,
} from '@/theme';

import { Chip } from '../../Chip';
import { Text } from '../../Text';
import { GallerySection } from '../GallerySection';

const TYPE_SAMPLE = 'Dayspoken, a voice journal';

const TYPE_STYLES = Object.keys(typography) as TypeStyle[];

export function TypeScaleSection() {
  return (
    <GallerySection title="Type scale">
      {TYPE_STYLES.map((style) => (
        <View key={style} className="gap-0.5">
          <Text variant="caption-sm" tone="muted">
            {`${style} · ${typography[style].fontSize}/${typography[style].lineHeight}`}
          </Text>
          <Text variant={style}>{TYPE_SAMPLE}</Text>
        </View>
      ))}
    </GallerySection>
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3">
      {/* The fill is the token value itself, so a swatch always shows the real color. */}
      <View
        className="h-9 w-9 rounded-xl border border-border"
        style={{ backgroundColor: value }}
      />
      <View className="flex-1">
        <Text variant="caption">{name}</Text>
        <Text variant="caption-sm" tone="muted">
          {value}
        </Text>
      </View>
    </View>
  );
}

export function ColorsSection() {
  const { scheme, colors } = useTheme();
  return (
    <GallerySection title="Colors">
      <Text variant="caption" tone="muted">{`Semantic tokens, ${scheme} mode`}</Text>
      {Object.entries(colors).map(([name, value]) => (
        <Swatch key={name} name={name} value={value} />
      ))}
    </GallerySection>
  );
}

export function MoodSection() {
  const { colors } = useTheme();
  return (
    <GallerySection title="Mood scale">
      <Text variant="caption" tone="muted">
        A mood is never shown by color alone: the label always goes with it.
      </Text>
      {MOOD_LEVELS.map((level) => {
        const { label, colorToken } = MOOD_SCALE[level];
        return (
          <View key={level} className="flex-row items-center gap-3">
            <Text variant="caption" tone="muted" className="w-4">
              {String(level)}
            </Text>
            <Chip label={label} dot={colorToken} />
          </View>
        );
      })}
      <Text
        variant="caption-sm"
        tone="muted"
      >{`Label text uses ${colors.foreground}, never a mood color.`}</Text>
    </GallerySection>
  );
}

export function RecordPaletteSection() {
  return (
    <GallerySection title="Record palette">
      <Text variant="caption" tone="muted">
        Always dark: these do not change with the mode.
      </Text>
      <Swatch name="background" value={recordPalette.background} />
      {recordPalette.orbStops.map((stop, index) => (
        <Swatch key={stop} name={`orb stop ${index + 1}`} value={stop} />
      ))}
      <Swatch name="finish" value={recordPalette.finish} />
      <Swatch name="progress" value={recordPalette.progress} />
    </GallerySection>
  );
}
