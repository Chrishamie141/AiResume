import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { firestoreService } from '../services/firestoreService';
import { User } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
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
    if (user) {
      try {
        const data = await firestoreService.getUser(user.uid);
        setUserData(data);
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          let data = await firestoreService.getUser(firebaseUser.uid);
          
          if (!data) {
            const isSpecialUser = firebaseUser.email === 'chrisnj141@gmail.com';
            data = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              plan: isSpecialUser ? 'pro' : 'free',
              createdAt: new Date().toISOString()
            };
            await firestoreService.saveUser(data);
          } else if (firebaseUser.email === 'chrisnj141@gmail.com' && data.plan !== 'pro') {
            data.plan = 'pro';
            await firestoreService.saveUser(data);
          }
          
          setUserData(data);
        } catch (error) {
          console.error('Error handling user data:', error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
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
