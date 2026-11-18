import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { useSignOut } from '@/features/auth';
import { env } from '@/lib/env';
import { Button, Screen, Text } from '@/ui';

// Temporary placeholder for the signed-in area. The app-shell change replaces it, and the
// "Sign out" button is temporary too: add-settings-account moves it into Settings and deletes it
// from here.
export default function IndexScreen() {
  const router = useRouter();
  const { signOut, isSigningOut } = useSignOut();

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-2">
        <Text variant="title">Dayspoken</Text>
        <Text>The development build is running.</Text>
        <Text variant="caption" tone="muted">
          Environment: {env.appEnv}
        </Text>
        <View className="pt-4">
          <Button label="Sign out" variant="secondary" loading={isSigningOut} onPress={signOut} />
        </View>
        {__DEV__ ? (
          <View className="pt-2">
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
