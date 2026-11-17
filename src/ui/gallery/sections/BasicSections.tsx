import { Bell, Mic, WifiOff } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '../../Button';
import { Card } from '../../Card';
import { Chip } from '../../Chip';
import { Demo, GallerySection } from '../GallerySection';
import { Icon } from '../../Icon';
import { IconButton } from '../../IconButton';
import { SectionHeader } from '../../SectionHeader';
import { Text } from '../../Text';

const noop = () => {};

export function ScreenSection() {
  return (
    <GallerySection title="Screen">
      <Text tone="muted">
        This page is a Screen: it fills the display with the background token, keeps clear of the
        status bar, and insets its content by the 20pt gutter. It scrolls.
      </Text>
    </GallerySection>
  );
}

export function TextSection() {
  return (
    <GallerySection title="Text">
      <Demo label="Tones">
        <Text>foreground</Text>
        <Text tone="muted">muted</Text>
        <Text tone="accent">accent</Text>
      </Demo>
      <Demo label="on-primary tone, on a hero card">
        <Card variant="hero">
          <Text>White without asking: the card sets the tone.</Text>
        </Card>
      </Demo>
    </GallerySection>
  );
}

export function IconSection() {
  return (
    <GallerySection title="Icon">
      <View className="flex-row items-center gap-4">
        <Icon icon={Mic} size={16} />
        <Icon icon={Mic} size={24} tone="accent" />
        <Icon icon={Bell} size={32} tone="muted" />
        <Icon icon={WifiOff} size={24} accessibilityLabel="Offline" />
      </View>
      <Text variant="caption" tone="muted">
        The last icon has an accessibility label. The others are decorative.
      </Text>
    </GallerySection>
  );
}

export function ButtonSection() {
  return (
    <GallerySection title="Button">
      <Demo label="Primary">
        <Button label="Primary" onPress={noop} />
      </Demo>
      <Demo label="Secondary">
        <Button label="Secondary" onPress={noop} variant="secondary" />
      </Demo>
      <Demo label="Ghost">
        <Button label="Ghost" onPress={noop} variant="ghost" />
      </Demo>
      <Demo label="With an icon, and small">
        <View className="flex-row items-center gap-3">
          <Button label="Record" onPress={noop} icon={Mic} />
          <Button label="Small" onPress={noop} size="sm" variant="secondary" />
        </View>
      </Demo>
      <Demo label="Disabled">
        <Button label="Disabled" onPress={noop} disabled />
      </Demo>
      <Demo label="Loading">
        <Button label="Saving" onPress={noop} loading />
      </Demo>
      <Demo label="Full width">
        <Button label="Full width" onPress={noop} fullWidth />
      </Demo>
    </GallerySection>
  );
}

export function IconButtonSection() {
  return (
    <GallerySection title="IconButton">
      <View className="flex-row items-center gap-3">
        <IconButton icon={Bell} accessibilityLabel="Plain" onPress={noop} />
        <IconButton icon={Bell} accessibilityLabel="Surface" onPress={noop} variant="surface" />
        <IconButton icon={Bell} accessibilityLabel="Primary" onPress={noop} variant="primary" />
        <IconButton icon={Mic} accessibilityLabel="Record" onPress={noop} variant="fab" />
        <IconButton icon={Bell} accessibilityLabel="Disabled" onPress={noop} disabled />
      </View>
      <Demo label="Inverse, on a hero card (the mic button)">
        <Card variant="hero">
          <IconButton icon={Mic} accessibilityLabel="Record" onPress={noop} variant="inverse" />
        </Card>
      </Demo>
    </GallerySection>
  );
}

export function CardSection() {
  return (
    <GallerySection title="Card">
      <Card>
        <Text variant="heading">Default card</Text>
        <Text tone="muted">A surface with the 22pt radius.</Text>
      </Card>
      <Card variant="hero">
        <Text variant="heading">Hero card</Text>
        <Text>Primary fill, 30pt radius, white text.</Text>
      </Card>
      <Card onPress={noop} accessibilityLabel="Pressable card">
        <Text variant="heading">Pressable card</Text>
        <Text tone="muted">One button for screen readers.</Text>
      </Card>
    </GallerySection>
  );
}

export function ChipSection() {
  return (
    <GallerySection title="Chip">
      <View className="flex-row flex-wrap gap-2">
        <Chip label="Work" />
        <Chip label="With icon" icon={Bell} />
        <Chip label="Low" dot="mood-2" />
        <Chip label="Great" dot="mood-5" />
        <Chip label="Selected" selected onSelectedChange={noop} />
        <Chip label="Not selected" onSelectedChange={noop} />
      </View>
    </GallerySection>
  );
}

export function SectionHeaderSection() {
  return (
    <GallerySection title="SectionHeader">
      <SectionHeader title="Recent" actionLabel="See all" onActionPress={noop} />
      <SectionHeader title="Today" size="sm" />
    </GallerySection>
  );
}
