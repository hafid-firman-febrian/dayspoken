import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { env } from '@/lib/env';
import { Button, Screen, Text } from '@/ui';

// Temporary placeholder. Replaced by the auth and app-shell changes.
export default function IndexScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-2">
        <Text variant="title">Dayspoken</Text>
        <Text>The development build is running.</Text>
        <Text variant="caption" tone="muted">
          Environment: {env.appEnv}
        </Text>
        {__DEV__ ? (
          <View className="pt-4">
            <Button
              label="Component gallery"
              variant="secondary"
              onPress={() => router.push('/dev/gallery')}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
