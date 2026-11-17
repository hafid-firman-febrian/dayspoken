import { Slot } from 'expo-router';
import { fireEvent, renderRouter, screen, within } from 'expo-router/testing-library';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors, ThemeScope, type ColorScheme } from '@/theme';
import { useThemeModeStore } from '@/theme/theme-mode-store';
import { UiProvider } from '@/ui';
import { TEST_SAFE_AREA } from '@/ui/test-utils';

import GalleryRoute from '../../../app/dev/gallery';
import IndexScreen from '../../../app/index';

const COMPONENT_SECTIONS = [
  'Screen',
  'Text',
  'Button',
  'IconButton',
  'TextField',
  'CodeInput',
  'Card',
  'Chip',
  'BottomSheet',
  'Dialog',
  'Toast',
  'EmptyState',
  'ErrorState',
  'Banner',
  'Skeleton',
  'SectionHeader',
  'Icon',
];

const TOKEN_SECTIONS = ['Theme', 'Type scale', 'Colors', 'Mood scale', 'Record palette'];

const setDev = (value: boolean) => {
  (globalThis as unknown as { __DEV__: boolean }).__DEV__ = value;
};

// The root layout of the real app provides the theme and the UI providers. This stands in for it.
function layoutFor(scheme: ColorScheme) {
  return function Layout() {
    return (
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
        <ThemeScope scheme={scheme}>
          <UiProvider>
            <Slot />
          </UiProvider>
        </ThemeScope>
      </SafeAreaProvider>
    );
  };
}

async function openGallery(scheme: ColorScheme = 'light') {
  await renderRouter(
    { _layout: layoutFor(scheme), index: IndexScreen, 'dev/gallery': GalleryRoute },
    { initialUrl: '/dev/gallery' },
  );
}

const section = (name: string) => within(screen.getByTestId(`section-${name}`));

describe('component gallery route', () => {
  const originalDev = (globalThis as unknown as { __DEV__: boolean }).__DEV__;

  beforeEach(() => {
    setDev(true);
    useThemeModeStore.setState({ mode: 'system' });
  });
  afterEach(() => setDev(originalDev));

  describe('in a development build', () => {
    it('opens at /dev/gallery', async () => {
      await openGallery();
      expect(screen).toHavePathname('/dev/gallery');
      expect(screen.getByText('Components')).toBeOnTheScreen();
    });

    it.each([...COMPONENT_SECTIONS, ...TOKEN_SECTIONS])('has a section titled %s', async (name) => {
      await openGallery();
      expect(screen.getByTestId(`section-${name}`)).toBeOnTheScreen();
      expect(section(name).getByRole('header', { name })).toBeOnTheScreen();
    });

    it('is reached from the placeholder home screen', async () => {
      await renderRouter(
        { _layout: layoutFor('light'), index: IndexScreen, 'dev/gallery': GalleryRoute },
        { initialUrl: '/' },
      );
      expect(screen).toHavePathname('/');
      await fireEvent.press(screen.getByRole('button', { name: 'Component gallery' }));
      expect(screen).toHavePathname('/dev/gallery');
    });
  });

  describe('component states', () => {
    it('shows the Button variants and its disabled and loading states', async () => {
      await openGallery();
      const buttons = section('Button');
      expect(buttons.getByRole('button', { name: 'Primary' })).toBeOnTheScreen();
      expect(buttons.getByRole('button', { name: 'Secondary' })).toBeOnTheScreen();
      expect(buttons.getByRole('button', { name: 'Ghost' })).toBeOnTheScreen();
      expect(buttons.getByRole('button', { name: 'Small' })).toBeOnTheScreen();
      expect(buttons.getByRole('button', { name: 'Disabled', disabled: true })).toBeOnTheScreen();
      expect(buttons.getByRole('button', { name: 'Saving', busy: true })).toBeOnTheScreen();
    });

    it('shows a TextField with an error', async () => {
      await openGallery();
      expect(section('TextField').getByText('Enter a valid email address')).toBeOnTheScreen();
    });

    it('shows a CodeInput with an error', async () => {
      await openGallery();
      expect(section('CodeInput').getByText('That code is not right')).toBeOnTheScreen();
    });

    it('shows an empty state, an error state, and a banner', async () => {
      await openGallery();
      expect(section('EmptyState').getByText('No entries yet')).toBeOnTheScreen();
      expect(section('ErrorState').getByText('Something went wrong')).toBeOnTheScreen();
      expect(section('Banner').getByText("You're offline")).toBeOnTheScreen();
    });
  });

  describe('overlays', () => {
    it('opens a dialog', async () => {
      await openGallery();
      expect(screen.queryByRole('header', { name: 'Delete entry?' })).toBeNull();
      await fireEvent.press(section('Dialog').getByRole('button', { name: 'Open dialog' }));
      expect(screen.getByRole('header', { name: 'Delete entry?' })).toBeOnTheScreen();
    });

    it('shows a toast', async () => {
      await openGallery();
      await fireEvent.press(section('Toast').getByRole('button', { name: 'Show toast' }));
      expect(screen.getByText('Entry saved')).toBeOnTheScreen();
    });

    it('has a button that opens a bottom sheet', async () => {
      await openGallery();
      expect(section('BottomSheet').getByRole('button', { name: 'Open sheet' })).toBeOnTheScreen();
    });
  });

  describe('theme switch', () => {
    it('offers System, Light, and Dark', async () => {
      await openGallery();
      for (const label of ['System', 'Light', 'Dark']) {
        expect(section('Theme').getByRole('button', { name: label })).toBeOnTheScreen();
      }
    });

    it('starts on System, and says so', async () => {
      await openGallery();
      expect(
        section('Theme').getByRole('button', { name: 'System', selected: true }),
      ).toBeOnTheScreen();
    });

    it('changes the real theme mode preference', async () => {
      await openGallery();
      await fireEvent.press(section('Theme').getByRole('button', { name: 'Dark' }));
      expect(useThemeModeStore.getState().mode).toBe('dark');
      expect(
        section('Theme').getByRole('button', { name: 'Dark', selected: true }),
      ).toBeOnTheScreen();
    });

    it('shows a forced-dark sample', async () => {
      await openGallery('light');
      expect(section('Theme').getByText('Always dark')).toBeOnTheScreen();
    });
  });

  describe('tokens', () => {
    it.each(['light', 'dark'] as const)('lists the %s color values', async (scheme) => {
      await openGallery(scheme);
      const other = scheme === 'light' ? 'dark' : 'light';
      expect(section('Colors').getAllByText(colors[scheme].background).length).toBeGreaterThan(0);
      expect(section('Colors').queryAllByText(colors[other].background)).toHaveLength(0);
    });

    it('shows every mood level with its label', async () => {
      await openGallery();
      for (const label of ['Rough', 'Low', 'Okay', 'Good', 'Great']) {
        expect(section('Mood scale').getByText(label)).toBeOnTheScreen();
      }
    });

    it('shows one sample for every text style', async () => {
      await openGallery();
      for (const style of [
        'display',
        'title',
        'heading',
        'body',
        'reading',
        'caption',
        'caption-sm',
      ]) {
        expect(section('Type scale').getByText(new RegExp(`^${style} ·`))).toBeOnTheScreen();
      }
    });
  });

  describe('in a production build', () => {
    it('sends /dev/gallery to the home screen', async () => {
      setDev(false);
      await openGallery();
      expect(screen).toHavePathname('/');
      expect(screen.queryByText('Components')).toBeNull();
      expect(screen.getByText('The development build is running.')).toBeOnTheScreen();
    });

    it('shows no gallery link on the home screen', async () => {
      setDev(false);
      await renderRouter(
        { _layout: layoutFor('light'), index: IndexScreen, 'dev/gallery': GalleryRoute },
        { initialUrl: '/' },
      );
      expect(screen.queryByRole('button', { name: 'Component gallery' })).toBeNull();
    });
  });
});
