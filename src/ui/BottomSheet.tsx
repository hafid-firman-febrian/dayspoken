import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing, useTheme } from '@/theme';

import { InsideBottomSheetContext } from './bottom-sheet-context';
import { Text } from './Text';

export type BottomSheetProps = {
  /** Controlled: the sheet is open while this is true. */
  open: boolean;
  /**
   * The user closed the sheet: a tap on the backdrop, a swipe down, or the Android back button.
   * Set `open` to false here. It is not called when the owner closes the sheet by setting
   * `open` to false itself.
   */
  onClose: () => void;
  /** Shown at the top, announced as a header. */
  title?: string;
  children?: ReactNode;
};

/** A modal sheet from the bottom. It sizes itself to its content. */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);

  // The library tells us when the sheet is gone, for any reason. Only a close that the owner
  // did not start is reported, so `onClose` never fires for the owner's own `open={false}`.
  const openRef = useRef(open);
  // Whether the library still has the sheet on screen, so it is never asked to dismiss twice.
  const presentedRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
    if (open) {
      presentedRef.current = true;
      sheetRef.current?.present();
    } else if (presentedRef.current) {
      presentedRef.current = false;
      sheetRef.current?.dismiss();
    }
  }, [open]);

  const handleDismiss = useCallback(() => {
    presentedRef.current = false;
    if (openRef.current) {
      onClose();
    }
  }, [onClose]);

  // The library does not handle the Android back button: close the sheet instead of the screen.
  useEffect(() => {
    if (!open) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      sheetRef.current?.dismiss();
      return true;
    });
    return () => subscription.remove();
  }, [open]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        // The scrim token already carries its own alpha, so the backdrop fades it to full.
        opacity={1}
        style={[props.style, { backgroundColor: colors.scrim }]}
      />
    ),
    [colors.scrim],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.card,
        borderTopRightRadius: radius.card,
      }}
      handleIndicatorStyle={{ backgroundColor: colors.muted }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      // `android_keyboardInputMode` is left at the library default on purpose. Setting it to
      // "adjustResize" stopped the sheet from rising above the keyboard on Android, which is
      // always edge-to-edge in SDK 58 (checked on a device: the input stayed behind the keyboard).
    >
      <InsideBottomSheetContext.Provider value>
        <BottomSheetView
          style={{
            paddingHorizontal: spacing.gutter,
            paddingBottom: insets.bottom + spacing.gutter,
            gap: 16,
          }}
        >
          {title ? <Text variant="heading">{title}</Text> : null}
          {children}
        </BottomSheetView>
      </InsideBottomSheetContext.Provider>
    </BottomSheetModal>
  );
}
