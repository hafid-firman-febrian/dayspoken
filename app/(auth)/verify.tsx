import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { VerifyCodeScreen } from '@/features/auth';

export default function VerifyRoute() {
  const router = useRouter();
  const { email, sentAt } = useLocalSearchParams<{ email?: string; sentAt?: string }>();
  const requestedAt = Number(sentAt);

  // Without an address and a send time there is no code to check (for example a typed link).
  if (!email || !sentAt || !Number.isFinite(requestedAt)) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <VerifyCodeScreen
      email={email}
      sentAt={requestedAt}
      // Goes back to Sign In if it is in the stack (with the address as typed), and opens it with
      // the address filled in if it is not (this screen was opened directly).
      onBack={() => router.dismissTo({ pathname: '/sign-in', params: { email } })}
    />
  );
}
