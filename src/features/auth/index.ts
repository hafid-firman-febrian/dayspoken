// Public API of the auth feature. Other code imports from '@/features/auth', never from a file
// inside it (ESLint enforces this).
export { AuthProvider } from './AuthProvider';
export { SignInScreen } from './components/SignInScreen';
export { VerifyCodeScreen } from './components/VerifyCodeScreen';
export { WelcomeScreen } from './components/WelcomeScreen';
export { useSession } from './hooks/useSession';
export { useSignOut } from './hooks/useSignOut';
export {
  OTP_LENGTH,
  OTP_LIFETIME_SECONDS,
  RESEND_SECONDS,
  type AuthErrorCode,
  type AuthFailure,
  type AuthResult,
  type AuthState,
} from './types';
