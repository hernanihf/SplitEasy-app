import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/lib/auth';

type UnreadActivityContextValue = {
  count: number;
  // Re-fetches the count from the server (e.g. after returning to the app).
  refresh: () => Promise<void>;
  // Tells the server "seen as of now" and clears the badge immediately.
  markSeen: () => Promise<void>;
};

const UnreadActivityContext = createContext<UnreadActivityContextValue | undefined>(undefined);

export function UnreadActivityProvider({ children }: { children: ReactNode }) {
  const { token, api } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!token) {
      setCount(0);
      return;
    }
    try {
      const res = await api.get<{ count: number }>('/api/v1/activity/unread-count');
      setCount(res.count);
    } catch {
      // Best-effort — a stale/missing badge isn't worth surfacing an error for.
    }
  }, [token, api]);

  const markSeen = useCallback(async () => {
    setCount(0);
    try {
      await api.post('/api/v1/activity/seen');
    } catch {
      // The server never learned about this — the next refresh() will
      // recover the true count instead of leaving the badge stuck at 0.
    }
  }, [api]);

  // No reset-to-0 branch for a missing token: the tab bar (the only place
  // this is shown) isn't rendered while logged out, and the next login
  // re-runs this effect and overwrites whatever's here with the real count.
  useEffect(() => {
    if (!token) return;
    api
      .get<{ count: number }>('/api/v1/activity/unread-count')
      .then((res) => setCount(res.count))
      .catch(() => {});
  }, [token, api]);

  return (
    <UnreadActivityContext.Provider value={{ count, refresh, markSeen }}>
      {children}
    </UnreadActivityContext.Provider>
  );
}

export function useUnreadActivity() {
  const ctx = useContext(UnreadActivityContext);
  if (!ctx) {
    throw new Error('useUnreadActivity must be used within an UnreadActivityProvider');
  }
  return ctx;
}
