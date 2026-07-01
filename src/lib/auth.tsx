import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { API_URL, createApiClient } from '@/lib/api';
import { getItem, removeItem, setItem } from '@/lib/storage';

const TOKEN_KEY = 'spliteasy.jwt';
const REFRESH_TOKEN_KEY = 'spliteasy.refreshToken';

// Set when an unauthenticated user opens an invite link, so the join can be
// resumed after they sign in.
export const PENDING_INVITE_KEY = 'spliteasy.pendingInvite';

type AuthContextValue = {
  token: string | null;
  isLoading: boolean;
  signIn: (accessToken: string, refreshToken: string) => Promise<void>;
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

  const signIn = async (accessToken: string, refreshToken: string) => {
    await Promise.all([setItem(TOKEN_KEY, accessToken), setItem(REFRESH_TOKEN_KEY, refreshToken)]);
    setToken(accessToken);
  };

  const clearSession = async () => {
    await Promise.all([removeItem(TOKEN_KEY), removeItem(REFRESH_TOKEN_KEY)]);
    setToken(null);
  };

  const signOut = async () => {
    const refreshToken = await getItem(REFRESH_TOKEN_KEY);
    await clearSession();
    if (refreshToken) {
      // Best-effort server-side revocation — sign-out shouldn't hang on the
      // network, and the local session is already gone either way.
      fetch(`${API_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {});
    }
  };

  // Access tokens are short-lived by design (see backend auth_service.go) —
  // refreshAccessToken silently exchanges the stored refresh token for a new
  // pair on a 401, so the user isn't bounced to the login screen every ~15
  // minutes. Concurrent 401s share one in-flight refresh: refresh tokens are
  // single-use/rotated, so firing it twice at once would make the second
  // call fail against an already-consumed token.
  const refreshingRef = useRef<Promise<string | null> | null>(null);

  const refreshAccessToken = (): Promise<string | null> => {
    if (refreshingRef.current) {
      return refreshingRef.current;
    }

    const attempt = (async () => {
      const refreshToken = await getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      try {
        const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!response.ok) return null;

        const data = (await response.json()) as { access_token: string; refresh_token: string };
        await Promise.all([setItem(TOKEN_KEY, data.access_token), setItem(REFRESH_TOKEN_KEY, data.refresh_token)]);
        setToken(data.access_token);
        return data.access_token;
      } catch {
        return null;
      }
    })();

    refreshingRef.current = attempt.finally(() => {
      refreshingRef.current = null;
    });
    return refreshingRef.current;
  };

  // On a 401 that a refresh couldn't recover, clear the session so the
  // AuthGate sends the user back to login instead of leaving them stuck on
  // an empty screen.
  const api = useMemo(
    () => createApiClient(() => token, refreshAccessToken, clearSession),
    [token],
  );

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
