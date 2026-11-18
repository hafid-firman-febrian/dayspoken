import { useRouter } from 'expo-router';

import { WelcomeScreen } from '@/features/auth';

export default function WelcomeRoute() {
  const router = useRouter();
  return <WelcomeScreen onGetStarted={() => router.push('/sign-in')} />;
}
