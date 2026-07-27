// Tiny pub/sub toast bus. toast({emoji, title, sub, tone}).
const subs = new Set();

export function toast(t) {
  subs.forEach((fn) => fn(t));
}

export function subscribeToast(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}
