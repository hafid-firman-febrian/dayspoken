import { StyleSheet, Text, View } from 'react-native';

// Temporary placeholder. Replaced by the auth and app-shell changes.
export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header">Dayspoken</Text>
      <Text>The development build is running.</Text>
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
