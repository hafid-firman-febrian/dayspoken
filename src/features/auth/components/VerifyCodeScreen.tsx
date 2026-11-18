import { useState } from 'react';
import { View } from 'react-native';

import { formatCountdown } from '@/utils/format-countdown';
import { Banner, Button, CodeInput, Screen, Text, useToast } from '@/ui';

import { useResendTimer } from '../hooks/useResendTimer';
import { useSendCode } from '../hooks/useSendCode';
import { useVerifyCode } from '../hooks/useVerifyCode';
import { OTP_LENGTH, type AuthFailure } from '../types';

type Props = {
  /** The address the code was sent to. */
  email: string;
  /** When the request for the first code started. The code's expiry is counted from here. */
  sentAt: number;
  /** Back to Sign In, to correct the address. */
  onBack: () => void;
};

// A wrong or expired code is a problem with the code, shown on the field. Anything else is about
// the request, so it is a banner with a retry that keeps the digits.
const isCodeProblem = (failure: AuthFailure) =>
  failure.code === 'CODE_WRONG' || failure.code === 'CODE_EXPIRED';

export function VerifyCodeScreen({ email, sentAt, onBack }: Props) {
  const toast = useToast();
  const { verify, isVerifying } = useVerifyCode();
  const { send, isSending } = useSendCode();

  const [code, setCode] = useState('');
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  // Two anchors, because they answer different questions: when the code that is valid now was
  // requested (for expiry), and when the resend timer started (a refused resend restarts the
  // timer but does not make the old code any younger).
  const [codeRequestedAt, setCodeRequestedAt] = useState(sentAt);
  const [timerFrom, setTimerFrom] = useState(sentAt);
  // Changing the key remounts the input, which puts the cursor back in it (autoFocus).
  const [inputKey, setInputKey] = useState(0);

  const { secondsLeft, canResend } = useResendTimer(timerFrom);

  const check = async (value: string) => {
    // A new attempt: the message about the last one no longer applies.
    setFailure(null);
    const result = await verify(email, value, codeRequestedAt);
    if (!result || result.ok) {
      return; // already checking, or signed in (the route guard takes it from here)
    }
    setFailure(result.error);
    if (isCodeProblem(result.error)) {
      setCode('');
      setInputKey((key) => key + 1);
    }
  };

  const handleChange = (value: string) => {
    setCode(value);
    setFailure(null);
  };

  const resend = async () => {
    setFailure(null);
    const result = await send(email);
    if (!result) {
      return;
    }
    if (result.ok) {
      setCodeRequestedAt(result.requestedAt);
      setTimerFrom(result.requestedAt);
      setCode('');
      setInputKey((key) => key + 1);
      toast.show('A new code is on its way.');
      return;
    }
    if (result.error.code === 'RATE_LIMITED') {
      setTimerFrom(Date.now());
    }
    setFailure(result.error);
  };

  const fieldError = failure && isCodeProblem(failure) ? failure.message : undefined;
  const bannerMessage = failure && !isCodeProblem(failure) ? failure.message : undefined;
  // After an expired code the new code is the only way forward, so resend becomes the main action.
  const expired = failure?.code === 'CODE_EXPIRED';

  return (
    <Screen scroll edges={['top', 'bottom', 'left', 'right']}>
      <View className="gap-6 pt-12 pb-6">
        <View className="gap-2">
          <Text variant="title">Check your email</Text>
          <Text tone="muted">We sent a 6-digit code to</Text>
          <Text variant="heading">{email}</Text>
          <Text variant="caption" tone="muted">
            It can take a minute. Check your spam folder if you do not see it.
          </Text>
        </View>

        <CodeInput
          key={inputKey}
          label="Verification code"
          value={code}
          onChangeText={handleChange}
          onComplete={(value) => void check(value)}
          error={fieldError}
          disabled={isVerifying}
          length={OTP_LENGTH}
          autoFocus
        />

        {bannerMessage ? (
          <Banner
            tone="accent"
            message={bannerMessage}
            actionLabel={code.length === OTP_LENGTH ? 'Try again' : undefined}
            onActionPress={code.length === OTP_LENGTH ? () => void check(code) : undefined}
          />
        ) : null}

        <View className="gap-2">
          <Button
            label={canResend ? 'Resend code' : `Resend code in ${formatCountdown(secondsLeft)}`}
            variant={expired ? 'primary' : 'secondary'}
            onPress={() => void resend()}
            disabled={!canResend}
            loading={isSending}
            fullWidth
          />
          <Button label="Use a different email" variant="ghost" onPress={onBack} fullWidth />
        </View>
      </View>
    </Screen>
  );
}
