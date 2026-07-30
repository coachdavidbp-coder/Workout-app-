import { useEffect, useRef, useState } from "react";

export const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Counts a number up from 0 on mount (and on change). Returns the display
// value. Honours reduced-motion by jumping straight to the target.
export function useCountUp(target, { ms = 700, decimals = 0 } = {}) {
  const end = Number(target) || 0;
  const [val, setVal] = useState(() => (reduceMotion() ? end : 0));
  const from = useRef(0);
  const raf = useRef(null);

  useEffect(() => {
    if (reduceMotion()) { setVal(end); return; }
    const start = performance.now();
    const a = from.current;
    const step = (t) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setVal(a + (end - a) * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else from.current = end;
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [end, ms]);

  return decimals ? Number(val.toFixed(decimals)) : Math.round(val);
}

// Returns false on first paint, then true — lets CSS transitions animate
// a value in from its resting state instead of appearing at the target.
export function useMountedFlag(delay = 60) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (reduceMotion()) { setOn(true); return; }
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return on;
}
