import { Stack } from 'expo-router';

// Routes are listed alphabetically, which would open Sign In first. Welcome is the entry point.
export const unstable_settings = { anchor: 'welcome' };

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
