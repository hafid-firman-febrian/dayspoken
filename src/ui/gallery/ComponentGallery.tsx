import { Screen } from '../Screen';
import { Text } from '../Text';

import {
  ButtonSection,
  CardSection,
  ChipSection,
  IconButtonSection,
  IconSection,
  ScreenSection,
  SectionHeaderSection,
  TextSection,
} from './sections/BasicSections';
import {
  BannerSection,
  EmptyStateSection,
  ErrorStateSection,
  SkeletonSection,
} from './sections/FeedbackSections';
import { CodeInputSection, TextFieldSection } from './sections/InputSections';
import { BottomSheetSection, DialogSection, ToastSection } from './sections/OverlaySections';
import { ThemeSection } from './sections/ThemeSection';
import {
  ColorsSection,
  MoodSection,
  RecordPaletteSection,
  TypeScaleSection,
} from './sections/TokenSections';

/**
 * Every base component, its states, and the design tokens on one page. Development only
 * (see app/dev/gallery.tsx). It holds no business logic and fetches nothing.
 */
export function ComponentGallery() {
  return (
    <Screen scroll>
      <Text variant="display" className="pb-1 pt-4">
        Components
      </Text>
      <Text tone="muted" className="pb-4">
        The Dayspoken design system. Switch the theme below to see everything in light and dark.
      </Text>
      <ThemeSection />
      <TypeScaleSection />
      <ColorsSection />
      <MoodSection />
      <RecordPaletteSection />
      <ScreenSection />
      <TextSection />
      <ButtonSection />
      <IconButtonSection />
      <TextFieldSection />
      <CodeInputSection />
      <CardSection />
      <ChipSection />
      <BottomSheetSection />
      <DialogSection />
      <ToastSection />
      <EmptyStateSection />
      <ErrorStateSection />
      <BannerSection />
      <SkeletonSection />
      <SectionHeaderSection />
      <IconSection />
    </Screen>
  );
}
