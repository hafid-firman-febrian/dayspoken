import { useLocalSearchParams, useRouter } from 'expo-router';

import { SignInScreen } from '@/features/auth';

export default function SignInRoute() {
  const router = useRouter();
  // Set when the user comes back from Verify Code to fix a typo.
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <SignInScreen
      initialEmail={email}
      onCodeSent={(sentTo, requestedAt) =>
        router.push({ pathname: '/verify', params: { email: sentTo, sentAt: String(requestedAt) } })
      }
    />
  );
}
