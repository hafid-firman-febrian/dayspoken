import { StyleSheet, Text, View } from 'react-native';

import { env } from '@/lib/env';

// Temporary placeholder. Replaced by the auth and app-shell changes.
export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" className="text-foreground">
        Dayspoken
      </Text>
      <Text className="text-foreground">The development build is running.</Text>
      <Text className="text-foreground">Environment: {env.appEnv}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
  },
});
