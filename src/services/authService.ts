import {
  ConfirmationResult,
  OAuthProvider,
  RecaptchaVerifier,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export type AuthUser = {
  uid: string;
  email: string | null;
  name: string | null;
};

const appleProvider = new OAuthProvider('apple.com');

export function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
  };
}

function getFriendlyErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try logging in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/popup-blocked':
      return 'Popup was blocked. Please allow popups and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing login.';

    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase Authentication yet.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Authentication settings.';
    case 'auth/invalid-phone-number':
      return 'Please enter a valid phone number with country code.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    default:
      return error instanceof Error ? error.message : 'Authentication failed. Please try again.';
  }
}

async function withFriendlyErrors<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
}

export const authService = {
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async signInWithGoogle(): Promise<UserCredential> {
    return withFriendlyErrors(() => signInWithPopup(auth, googleProvider));
  },

  async signInWithApple(): Promise<UserCredential> {
    return withFriendlyErrors(() => signInWithPopup(auth, appleProvider));
  },

  async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    return withFriendlyErrors(() => signInWithEmailAndPassword(auth, email.trim(), password));
  },

  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<UserCredential> {
    return withFriendlyErrors(async () => {
      try {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (displayName?.trim()) {
          await updateProfile(credential.user, { displayName: displayName.trim() });
        }
        return credential;
      } catch (error) {
        const code =
          typeof error === 'object' && error && 'code' in error
            ? String((error as { code?: string }).code)
            : '';

        if (code === 'auth/email-already-in-use') {
          return signInWithEmailAndPassword(auth, email.trim(), password);
        }

        throw error;
      }
    });
  },

  async sendResetPassword(email: string): Promise<void> {
    return withFriendlyErrors(() => sendPasswordResetEmail(auth, email.trim()));
  },

  createPhoneRecaptcha(containerId: string): RecaptchaVerifier {
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // handled after verifyPhoneNumber
      },
    });
  },

  async requestPhoneCode(phoneNumber: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> {
    return withFriendlyErrors(() => signInWithPhoneNumber(auth, phoneNumber, verifier));
  },

  async verifyPhoneCode(confirmationResult: ConfirmationResult, code: string): Promise<UserCredential> {
    return withFriendlyErrors(() => confirmationResult.confirm(code));
  },

  async logout(): Promise<void> {
    return withFriendlyErrors(() => signOut(auth));
  },

  isAppleSupported(): boolean {
    const appleEnabled = import.meta.env.VITE_ENABLE_APPLE_AUTH === 'true';
    return appleEnabled && typeof window !== 'undefined' && window.isSecureContext;
  },
};
