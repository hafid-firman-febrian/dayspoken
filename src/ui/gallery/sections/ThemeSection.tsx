import { View } from 'react-native';

import { ThemeScope, useThemeMode, type ThemeMode } from '@/theme';

import { Card } from '../../Card';
import { Chip } from '../../Chip';
import { Text } from '../../Text';
import { Demo, GallerySection } from '../GallerySection';

const MODES: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'System' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
];

/** The real theme-mode preference: choosing here changes the whole app and is saved. */
export function ThemeSection() {
  const { mode, setMode } = useThemeMode();
  return (
    <GallerySection title="Theme">
      <Demo label="Theme mode">
        <View className="flex-row gap-2">
          {MODES.map((option) => (
            <Chip
              key={option.mode}
              label={option.label}
              selected={mode === option.mode}
              onSelectedChange={() => setMode(option.mode)}
            />
          ))}
        </View>
      </Demo>
      <Demo label="Forced dark scope, whatever the mode is">
        <View className="h-28">
          <ThemeScope scheme="dark">
            <Card>
              <Text variant="heading">Always dark</Text>
              <Text tone="muted">Like the Record screen.</Text>
            </Card>
          </ThemeScope>
        </View>
      </Demo>
    </GallerySection>
  );
}
