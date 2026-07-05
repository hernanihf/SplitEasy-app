import { useEffect, useState } from 'react';

// Web-only by design — SplitEasy is only deployed as a PWA today. Falls back
// to "online" when there's no browser environment (e.g. a native bundle)
// rather than guessing wrong and blocking real requests.
function currentlyOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function useIsOnline(): boolean {
  const [online, setOnline] = useState(currentlyOnline);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
