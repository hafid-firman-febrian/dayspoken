import type { ReactNode } from 'react';
import { View } from 'react-native';

import { SectionHeader } from '../SectionHeader';
import { Text } from '../Text';

type SectionProps = {
  /** The component's name, or the token group's name. Also the section's test id. */
  title: string;
  children: ReactNode;
};

/** One titled block of the gallery. */
export function GallerySection({ title, children }: SectionProps) {
  return (
    <View testID={`section-${title}`} className="gap-3 pb-6">
      <SectionHeader title={title} />
      {children}
    </View>
  );
}

/** A labeled example inside a section: one state or variant. */
export function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text variant="caption-sm" tone="muted">
        {label}
      </Text>
      {children}
    </View>
  );
}
