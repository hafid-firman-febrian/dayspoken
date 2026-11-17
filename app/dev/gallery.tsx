import { Redirect } from 'expo-router';

import { ComponentGallery } from '@/ui/gallery';

// Development only: in a production build this route sends the user to the home screen.
export default function GalleryRoute() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  return <ComponentGallery />;
}
