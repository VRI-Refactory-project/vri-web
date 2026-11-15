import { useEffect, useRef } from 'react';

/** Calls `callback` every `ms` milliseconds while mounted. Pass null to pause. */
export function useInterval(callback: () => void, ms: number | null) {
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  }, [callback]);

  useEffect(() => {
    if (ms === null) return;
    const timer = setInterval(() => latest.current(), ms);
    return () => clearInterval(timer);
  }, [ms]);
}
