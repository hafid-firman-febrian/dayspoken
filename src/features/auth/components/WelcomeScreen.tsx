import { Info } from 'lucide-react-native';
import { View } from 'react-native';

import { Button, Icon, Screen, Text, useToast } from '@/ui';

type Props = {
  onGetStarted: () => void;
};

// Shown before sign-in, so nobody records audio without having seen it.
export const PRIVACY_NOTICE =
  "This demo processes audio with Google Gemini's free tier. Avoid recording sensitive information.";

export function WelcomeScreen({ onGetStarted }: Props) {
  const toast = useToast();

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <View className="flex-1 justify-center gap-3">
        <Text variant="caption" tone="accent">
          Dayspoken
        </Text>
        <Text variant="display">Talk for a minute. Keep the whole day.</Text>
        <Text tone="muted">
          Record a short voice note. Dayspoken writes the entry, picks up your mood, and lets you
          ask your past self.
        </Text>
      </View>

      <View className="gap-3 pb-4">
        <Button label="Get started" onPress={onGetStarted} fullWidth />
        {/* A placeholder until the demo account exists (add-demo-account). */}
        <Button
          label="Try the demo"
          variant="secondary"
          onPress={() => toast.show('The demo is coming soon.')}
          fullWidth
        />
        <View testID="privacy-notice" className="flex-row items-start gap-2 pt-2">
          <View className="pt-0.5">
            <Icon icon={Info} size={14} tone="muted" />
          </View>
          <Text variant="caption" tone="muted" className="flex-1">
            {PRIVACY_NOTICE}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
