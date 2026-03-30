import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { databaseService } from '../services/databaseService';
import { AuthUser, authService, SessionUser, toAuthUser } from '../services/authService';
import { User } from '../types';

interface AuthContextType {
  user: SessionUser | null;
  authUser: AuthUser | null;
  userData: User | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async () => {
    if (!user) {
      setUserData(null);
      return;
    }

    try {
      const data = await databaseService.getUser(user.id);
      setUserData(data);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const session = await authService.getSession();
        const initialUser = session?.user ?? null;
        setUser(initialUser);

        if (!initialUser) {
          setUserData(null);
          return;
        }

        let data = await databaseService.getUser(initialUser.id);

        if (!data) {
          data = {
            uid: initialUser.id,
            email: initialUser.email || '',
            displayName: (initialUser.user_metadata?.full_name as string | undefined) || '',
            photoURL: '',
            plan: 'free',
            createdAt: new Date().toISOString(),
          };
          await databaseService.saveUser(data);
        }

        setUserData(data);
      } catch (error) {
        console.error('Error bootstrapping auth:', error);
      } finally {
        setLoading(false);
      }
    };

    void bootstrapAuth();

    const subscription = authService.onAuthStateChange(async (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setUserData(null);
        return;
      }

      try {
        let data = await databaseService.getUser(nextUser.id);

        if (!data) {
          data = {
            uid: nextUser.id,
            email: nextUser.email || '',
            displayName: (nextUser.user_metadata?.full_name as string | undefined) || '',
            photoURL: '',
            plan: 'free',
            createdAt: new Date().toISOString(),
          };
          await databaseService.saveUser(data);
        }

        setUserData(data);
      } catch (error) {
        console.error('Error handling auth user data:', error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const authUser = useMemo(() => toAuthUser(user), [user]);

  return (
    <AuthContext.Provider value={{ user, authUser, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
