import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (mode === 'login') {
        await authService.signInWithEmail(email, password);
        setSuccessMessage('Signed in successfully. Redirecting...');
      } else {
        await authService.signUpWithEmail(email, password, name);
        setSuccessMessage('Account created successfully. Redirecting...');
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-lg md:p-8">
        <h1 className="text-center text-2xl font-semibold text-stone-900">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-2 text-center text-sm text-stone-500">
          Continue with your email and password.
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

        <form onSubmit={handleEmailSubmit} className="mt-6 space-y-3">
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
            disabled={loading}
            className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in with Email' : 'Create account with Email'}
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
