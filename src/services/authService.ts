export type SessionUser = {
  id: string;
  email: string | null;
  user_metadata?: Record<string, unknown>;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: SessionUser;
};

export type AuthUser = {
  uid: string;
  email: string | null;
  name: string | null;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SESSION_KEY = 'supabase_auth_session';

type AuthChangeCallback = (user: SessionUser | null) => void;

const listeners = new Set<AuthChangeCallback>();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase frontend env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function setStoredSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
  } else {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  const user = session?.user ?? null;
  listeners.forEach((callback) => callback(user));
}

async function authRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.msg || payload?.error_description || payload?.error || 'Auth request failed');
  }

  return payload as T;
}

export function toAuthUser(user: SessionUser | null): AuthUser | null {
  if (!user) return null;

  return {
    uid: user.id,
    email: user.email,
    name: (user.user_metadata?.full_name as string | undefined) ?? null,
  };
}

export const authService = {
  async getSession(): Promise<AuthSession | null> {
    return getStoredSession();
  },

  async getCurrentUser(): Promise<SessionUser | null> {
    return getStoredSession()?.user ?? null;
  },

  async getAccessToken(): Promise<string | null> {
    return getStoredSession()?.access_token ?? null;
  },

  onAuthStateChange(callback: AuthChangeCallback) {
    listeners.add(callback);
    return {
      unsubscribe() {
        listeners.delete(callback);
      },
    };
  },

  async signInWithEmail(email: string, password: string): Promise<SessionUser> {
    const data = await authRequest<AuthSession>('token?grant_type=password', {
      email: email.trim(),
      password,
    });
    setStoredSession(data);
    return data.user;
  },

  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<SessionUser> {
    const data = await authRequest<AuthSession>('signup', {
      email: email.trim(),
      password,
      data: {
        full_name: displayName?.trim() || undefined,
      },
    });
    setStoredSession(data);
    return data.user;
  },

  async logout(): Promise<void> {
    const token = getStoredSession()?.access_token;

    if (token) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }

    setStoredSession(null);
  },
};
