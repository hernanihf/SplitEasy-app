import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { API_URL, createApiClient } from '@/lib/api';
import { getItem, removeItem, setItem } from '@/lib/storage';

const TOKEN_KEY = 'spliteasy.jwt';

// Set when an unauthenticated user opens an invite link, so the join can be
// resumed after they sign in.
export const PENDING_INVITE_KEY = 'spliteasy.pendingInvite';

type AuthContextValue = {
  token: string | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  api: ReturnType<typeof createApiClient>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getItem(TOKEN_KEY)
      .then(setToken)
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = async (newToken: string) => {
    await setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  };

  const signOut = async () => {
    await removeItem(TOKEN_KEY);
    setToken(null);
  };

  const api = useMemo(() => createApiClient(() => token), [token]);

  return (
    <AuthContext.Provider value={{ token, isLoading, signIn, signOut, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export const googleLoginUrl = `${API_URL}/api/v1/auth/google/login`;
