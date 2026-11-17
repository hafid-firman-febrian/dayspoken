import { useState } from 'react';

import { BottomSheet } from '../../BottomSheet';
import { Button } from '../../Button';
import { Dialog } from '../../Dialog';
import { Demo, GallerySection } from '../GallerySection';
import { TextField } from '../../TextField';
import { useToast } from '../../Toast';

const CONFIRM_MS = 1500;

export function BottomSheetSection() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  return (
    <GallerySection title="BottomSheet">
      <Button label="Open sheet" onPress={() => setOpen(true)} />
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Edit entry">
        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Type here" />
        <Button label="Save" onPress={() => setOpen(false)} />
      </BottomSheet>
    </GallerySection>
  );
}

export function DialogSection() {
  const [open, setOpen] = useState(false);
  return (
    <GallerySection title="Dialog">
      <Button label="Open dialog" variant="secondary" onPress={() => setOpen(true)} />
      <Dialog
        visible={open}
        title="Delete entry?"
        message="This also removes its audio. The confirm button waits 1.5 seconds."
        confirmLabel="Delete"
        // An asynchronous confirm: the dialog shows loading and cannot be closed meanwhile.
        onConfirm={async () => {
          await new Promise((resolve) => setTimeout(resolve, CONFIRM_MS));
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </GallerySection>
  );
}

export function ToastSection() {
  const { show } = useToast();
  return (
    <GallerySection title="Toast">
      <Demo label="Message">
        <Button label="Show toast" variant="secondary" onPress={() => show('Entry saved')} />
      </Demo>
      <Demo label="With an action">
        <Button
          label="Show toast with action"
          variant="secondary"
          onPress={() =>
            show('Entry deleted', { actionLabel: 'Undo', onAction: () => show('Entry restored') })
          }
        />
      </Demo>
    </GallerySection>
  );
}
