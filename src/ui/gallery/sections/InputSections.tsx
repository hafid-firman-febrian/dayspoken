import { useState } from 'react';

import { CodeInput } from '../../CodeInput';
import { Demo, GallerySection } from '../GallerySection';
import { TextField } from '../../TextField';
import { useToast } from '../../Toast';

export function TextFieldSection() {
  const [email, setEmail] = useState('');
  return (
    <GallerySection title="TextField">
      <Demo label="Default, with helper text">
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          helperText="We never share it."
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </Demo>
      <Demo label="Error">
        <TextField label="Email" value="not-an-email" error="Enter a valid email address" />
      </Demo>
      <Demo label="Disabled">
        <TextField label="Email" value="ada@example.com" disabled />
      </Demo>
      <Demo label="Multiline">
        <TextField label="Notes" placeholder="Write something" multiline />
      </Demo>
    </GallerySection>
  );
}

export function CodeInputSection() {
  const [code, setCode] = useState('');
  const { show } = useToast();
  return (
    <GallerySection title="CodeInput">
      <Demo label="Type or paste six digits">
        <CodeInput
          label="Verification code"
          value={code}
          onChangeText={setCode}
          onComplete={(complete) => show(`Code entered: ${complete}`)}
        />
      </Demo>
      <Demo label="Error">
        <CodeInput
          label="Verification code"
          value="123456"
          onChangeText={() => {}}
          error="That code is not right"
        />
      </Demo>
      <Demo label="Disabled">
        <CodeInput label="Verification code" value="123" onChangeText={() => {}} disabled />
      </Demo>
    </GallerySection>
  );
}
