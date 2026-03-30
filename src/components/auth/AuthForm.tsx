import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { authService } from '../../services/authService';

type AuthMode = 'login' | 'signup';

type Props = {
  defaultMode?: AuthMode;
};

export default function AuthForm({ defaultMode = 'login' }: Props) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);
  const [usePhone, setUsePhone] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [phoneVerifier, setPhoneVerifier] = useState<RecaptchaVerifier | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    return () => {
      phoneVerifier?.clear();
    };
  }, [phoneVerifier]);

  const appleEnabled = useMemo(() => authService.isAppleSupported(), []);

  async function runAction(method: string, action: () => Promise<void>) {
    setLoadingMethod(method);
    setError('');
    setSuccessMessage('');
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoadingMethod(null);
    }
  }

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();

    await runAction(mode === 'login' ? 'email-login' : 'email-signup', async () => {
      if (mode === 'login') {
        await authService.signInWithEmail(email, password);
        setSuccessMessage('Signed in successfully. Redirecting...');
      } else {
        await authService.signUpWithEmail(email, password, name);
        setSuccessMessage('Account created successfully. Redirecting...');
      }

      navigate('/dashboard');
    });
  };

  const handleGoogle = async () => {
    await runAction('google', async () => {
      await authService.signInWithGoogle();
      setSuccessMessage('Signed in with Google. Redirecting...');
      navigate('/dashboard');
    });
  };

  const handleApple = async () => {
    await runAction('apple', async () => {
      await authService.signInWithApple();
      setSuccessMessage('Signed in with Apple. Redirecting...');
      navigate('/dashboard');
    });
  };

  const handlePhoneRequestCode = async () => {
    await runAction('phone-request', async () => {
      const verifier = authService.createPhoneRecaptcha('phone-recaptcha-container');
      setPhoneVerifier(verifier);
      const result = await authService.requestPhoneCode(phoneNumber, verifier);
      setConfirmation(result);
      setSuccessMessage('SMS code sent. Enter the code to continue.');
    });
  };

  const handlePhoneVerifyCode = async () => {
    if (!confirmation) return;

    await runAction('phone-verify', async () => {
      await authService.verifyPhoneCode(confirmation, phoneCode);
      setSuccessMessage('Phone number verified. Redirecting...');
      navigate('/dashboard');
    });
  };

  const isLoading = (method: string) => loadingMethod === method;

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-lg md:p-8">
        <h1 className="text-center text-2xl font-semibold text-stone-900">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-2 text-center text-sm text-stone-500">
          Use Firebase Authentication to continue.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <button
            onClick={handleGoogle}
            disabled={!!loadingMethod}
            className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {isLoading('google') ? 'Please wait…' : 'Continue with Google'}
          </button>

          {appleEnabled ? (
            <button
              onClick={handleApple}
              disabled={!!loadingMethod}
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-900 hover:bg-stone-100 disabled:opacity-60"
            >
              {isLoading('apple') ? 'Please wait…' : 'Continue with Apple'}
            </button>
          ) : (
            <button
              disabled
              className="w-full rounded-xl border border-stone-200 bg-stone-100 px-4 py-3 text-sm text-stone-500"
              title="Apple sign-in requires Firebase setup"
            >
              Apple sign-in unavailable
            </button>
          )}
        </div>

        {/* Helpful debug message (kept from your branch) */}
        <p className="mt-3 text-xs text-stone-500">
          Google/Apple popup errors usually mean provider setup is incomplete in Firebase.
        </p>

        <div className="my-6 flex items-center gap-3 text-xs text-stone-400">
          <span className="h-px flex-1 bg-stone-200" />
          <span>or</span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        {/* EMAIL FORM */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email"
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Password"
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
          />

          <button
            type="submit"
            disabled={!!loadingMethod}
            className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {isLoading('email-login') || isLoading('email-signup')
              ? 'Please wait…'
              : mode === 'login'
              ? 'Sign in with Email'
              : 'Create account with Email'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          {mode === 'login' ? (
            <>
              New here? <Link to="/signup" className="underline">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/login" className="underline">Sign in</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}