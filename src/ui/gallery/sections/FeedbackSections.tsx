import { Inbox } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Banner } from '../../Banner';
import { EmptyState } from '../../EmptyState';
import { ErrorState } from '../../ErrorState';
import { Demo, GallerySection } from '../GallerySection';
import { Skeleton } from '../../Skeleton';

const noop = () => {};
const RETRY_MS = 1500;

export function EmptyStateSection() {
  return (
    <GallerySection title="EmptyState">
      <EmptyState
        icon={Inbox}
        title="No entries yet"
        message="Record your first entry to see it here."
        actionLabel="Record your first entry"
        onActionPress={noop}
      />
    </GallerySection>
  );
}

export function ErrorStateSection() {
  const [retrying, setRetrying] = useState(false);
  const retry = () => {
    setRetrying(true);
    setTimeout(() => setRetrying(false), RETRY_MS);
  };
  return (
    <GallerySection title="ErrorState">
      <ErrorState
        message="Check your connection and try again."
        onRetry={retry}
        retrying={retrying}
      />
    </GallerySection>
  );
}

export function BannerSection() {
  const [dismissed, setDismissed] = useState(false);
  return (
    <GallerySection title="Banner">
      <Demo label="Neutral">
        <Banner message="You're offline" />
      </Demo>
      <Demo label="Accent, with an action">
        <Banner
          tone="accent"
          message="Demo quota reached for today"
          actionLabel="Details"
          onActionPress={noop}
        />
      </Demo>
      <Demo label="Dismissible">
        {dismissed ? null : (
          <Banner
            message="Your recording is waiting to upload"
            onDismiss={() => setDismissed(true)}
          />
        )}
      </Demo>
    </GallerySection>
  );
}

export function SkeletonSection() {
  return (
    <GallerySection title="Skeleton">
      <View className="gap-3">
        <Skeleton shape="text" width="60%" />
        <Skeleton shape="text" />
        <Skeleton shape="card" height={80} />
        <Skeleton shape="pill" width={120} />
      </View>
    </GallerySection>
  );
}
