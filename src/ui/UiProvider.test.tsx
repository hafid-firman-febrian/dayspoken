import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text as NativeText } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeScope } from '@/theme';

import { TEST_SAFE_AREA } from './test-utils';
import { useToast } from './Toast';
import { UiProvider } from './UiProvider';

function ToastButton() {
  const { show } = useToast();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Toast" onPress={() => show('Hello')}>
      <NativeText>Toast</NativeText>
    </Pressable>
  );
}

describe('UiProvider', () => {
  it('renders its children', async () => {
    await render(
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
        <ThemeScope scheme="light">
          <UiProvider>
            <NativeText>App content</NativeText>
          </UiProvider>
        </ThemeScope>
      </SafeAreaProvider>,
    );
    expect(screen.getByText('App content')).toBeOnTheScreen();
  });

  it('lets a component show toasts', async () => {
    await render(
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
        <ThemeScope scheme="light">
          <UiProvider>
            <ToastButton />
          </UiProvider>
        </ThemeScope>
      </SafeAreaProvider>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Toast' }));
    expect(screen.getByText('Hello')).toBeOnTheScreen();
  });
});
