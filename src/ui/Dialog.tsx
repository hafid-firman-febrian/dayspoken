import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';

export type DialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  /** Default "Confirm". Use a clear verb for a destructive action, for example "Delete". */
  confirmLabel?: string;
  /** Default "Cancel". */
  cancelLabel?: string;
  /**
   * Called when the confirm button is pressed. It may return a promise: while that is pending,
   * the dialog shows loading and cannot be closed. The caller closes the dialog (`visible`).
   */
  onConfirm: () => void | Promise<void>;
  /** Cancel button, tap on the backdrop, or the Android back button. */
  onCancel: () => void;
};

/** A centered confirmation over a dimmed backdrop. */
export function Dialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: DialogProps) {
  const [confirming, setConfirming] = useState(false);

  // While the confirm action runs, nothing may close the dialog.
  const cancel = () => {
    if (!confirming) {
      onCancel();
    }
  };

  const confirm = async () => {
    if (confirming) {
      return;
    }
    const result = onConfirm();
    if (result instanceof Promise) {
      setConfirming(true);
      try {
        await result;
      } finally {
        // An error from onConfirm still reaches the caller. The dialog only stops loading.
        setConfirming(false);
      }
    }
  };

  return (
    <Modal
      testID="dialog"
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={cancel}
    >
      <View className="flex-1 items-center justify-center px-gutter">
        <Pressable
          testID="dialog-backdrop"
          // The backdrop is a tap target for sighted users. Screen readers use the Cancel button.
          accessible={false}
          onPress={cancel}
          className="absolute inset-0 bg-scrim"
        />
        <View
          accessibilityViewIsModal
          className="w-full gap-4 rounded-card bg-surface p-6"
          style={{ maxWidth: 400 }}
        >
          <View className="gap-2">
            <Text variant="heading">{title}</Text>
            {message ? <Text tone="muted">{message}</Text> : null}
          </View>
          <View className="flex-row justify-end gap-3">
            <Button
              label={cancelLabel}
              onPress={cancel}
              variant="secondary"
              disabled={confirming}
            />
            <Button label={confirmLabel} onPress={confirm} loading={confirming} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
