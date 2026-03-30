import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { firestoreService } from '../services/firestoreService';
import { AuthUser, authService, toAuthUser } from '../services/authService';
import { User } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  authUser: AuthUser | null;
  userData: User | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async () => {
    if (!user) {
      setUserData(null);
      return;
    }

    try {
      const data = await firestoreService.getUser(user.uid);
      setUserData(data);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        let data = await firestoreService.getUser(firebaseUser.uid);

        if (!data) {
          data = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            plan: 'free',
            createdAt: new Date().toISOString(),
          };
          await firestoreService.saveUser(data);
        }

        setUserData(data);
      } catch (error) {
        console.error('Error handling user data:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const authUser = useMemo(() => toAuthUser(user), [user]);

  return (
    <AuthContext.Provider value={{ user, authUser, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
