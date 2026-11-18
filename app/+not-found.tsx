import { Redirect } from 'expo-router';

import { useSession } from '@/features/auth';

// The router does not know a route its guard is closed to, so a signed-out user opening "/" (a
// normal launch) or a signed-in user opening "/welcome" would land on a "not found" screen. This
// sends both to the entry screen of the area they are in. It is also where a link to a route
// that does not exist ends up, which is fine for an app with no web pages.
export default function NotFoundRoute() {
  const { status } = useSession();
  return <Redirect href={status === 'signed-in' ? '/' : '/welcome'} />;
}
