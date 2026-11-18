import { useState } from 'react';
import { View } from 'react-native';

import { Banner, Button, Screen, Text, TextField } from '@/ui';

import { isValidEmail } from '../api';
import { authFailure } from '../errors';
import { useSendCode } from '../hooks/useSendCode';
import type { AuthFailure } from '../types';

type Props = {
  /** The address typed before, for example when the user comes back from Verify Code. */
  initialEmail?: string;
  /** The code was sent: `email` is the address as sent, `requestedAt` when the request started. */
  onCodeSent: (email: string, requestedAt: number) => void;
};

export function SignInScreen({ initialEmail = '', onCodeSent }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  const { send, isSending } = useSendCode();

  const handleChange = (text: string) => {
    setEmail(text);
    // Editing starts a new attempt.
    setFailure(null);
  };

  const submit = async () => {
    if (!isValidEmail(email)) {
      setFailure(authFailure('INVALID_EMAIL'));
      return;
    }
    const result = await send(email);
    if (!result) {
      return; // a request is already running
    }
    if (result.ok) {
      onCodeSent(result.email, result.requestedAt);
    } else {
      setFailure(result.error);
    }
  };

  // A bad address belongs on the field. Anything else (rate limit, offline, a failed send) is
  // about the request, so it is a banner above the button.
  const fieldError = failure?.code === 'INVALID_EMAIL' ? failure.message : undefined;
  const bannerMessage = failure && failure.code !== 'INVALID_EMAIL' ? failure.message : undefined;

  return (
    <Screen scroll edges={['top', 'bottom', 'left', 'right']}>
      <View className="gap-6 pt-12 pb-6">
        <View className="gap-2">
          <Text variant="title">Sign in</Text>
          <Text tone="muted">
            Enter your email and we will send you a 6-digit code. There is no password.
          </Text>
        </View>

        <TextField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={handleChange}
          error={fieldError}
          disabled={isSending}
          keyboardType="email-address"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={() => void submit()}
        />

        {bannerMessage ? <Banner tone="accent" message={bannerMessage} /> : null}

        <Button label="Send code" onPress={() => void submit()} loading={isSending} fullWidth />
      </View>
    </Screen>
  );
}
