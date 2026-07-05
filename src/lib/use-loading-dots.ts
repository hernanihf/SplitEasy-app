import { useEffect, useState } from 'react';

// Cycles 0 -> 1 -> 2 -> 3 -> 0 ..., returning that many dots, so a loading
// message visibly progresses ("Loading" / "Loading." / "Loading.." / ...)
// instead of sitting static. Plain setInterval rather than a native-only
// animation driver (like Reanimated) since it needs to behave identically
// on the web build's static-export/hydration path and on native.
export function useLoadingDots(intervalMs = 400): string {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCount((c) => (c + 1) % 4), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return '.'.repeat(count);
}
