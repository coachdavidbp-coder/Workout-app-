// One clock for a whole training session.
//
// Stretching, the warm-up, the lifts and the yoga each used to run their own
// timer, so the session read as four unrelated stopwatches. The workout timer
// owns the real elapsed count and publishes it here; the full-screen guided
// sequences subscribe so they can show the same number rather than starting
// something new.
const subs = new Set();
let elapsed = 0;
let phase = null;

export function setSession(sec, label = null) {
  elapsed = sec;
  phase = label;
  subs.forEach((fn) => fn(elapsed, phase));
}

export function getSession() {
  return { elapsed, phase };
}

export function subscribeSession(fn) {
  subs.add(fn);
  fn(elapsed, phase);
  return () => subs.delete(fn);
}
